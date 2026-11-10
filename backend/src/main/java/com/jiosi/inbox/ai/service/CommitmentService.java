package com.jiosi.inbox.ai.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.jiosi.inbox.ai.client.GroqClient;
import com.jiosi.inbox.ai.config.GroqProperties;
import com.jiosi.inbox.ai.dto.CommitmentStatusUpdateRequest;
import com.jiosi.inbox.ai.dto.EmailCommitmentDto;
import com.jiosi.inbox.ai.dto.GroqChatRequest;
import com.jiosi.inbox.ai.dto.GroqChatResponse;
import com.jiosi.inbox.ai.entity.EmailCommitment;
import com.jiosi.inbox.ai.repository.EmailCommitmentRepository;
import com.jiosi.inbox.common.ResourceNotFoundException;
import com.jiosi.inbox.email.Email;
import com.jiosi.inbox.email.EmailRepository;
import com.jiosi.inbox.email.EmailThread;
import com.jiosi.inbox.email.EmailThreadRepository;
import com.jiosi.inbox.security.WorkspaceAuthorizationService;
import com.jiosi.inbox.user.User;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.format.DateTimeParseException;
import java.util.*;

@Service
public class CommitmentService {

    private static final Logger log = LoggerFactory.getLogger(CommitmentService.class);

    private final GroqClient groqClient;
    private final GroqProperties groqProperties;
    private final PromptInjectionGuard promptGuard;
    private final EvidenceValidator evidenceValidator;
    private final EmailCommitmentRepository commitmentRepository;
    private final EmailThreadRepository threadRepository;
    private final EmailRepository emailRepository;
    private final WorkspaceAuthorizationService workspaceAuthService;
    private final ObjectMapper objectMapper;

    public CommitmentService(
            GroqClient groqClient,
            GroqProperties groqProperties,
            PromptInjectionGuard promptGuard,
            EvidenceValidator evidenceValidator,
            EmailCommitmentRepository commitmentRepository,
            EmailThreadRepository threadRepository,
            EmailRepository emailRepository,
            WorkspaceAuthorizationService workspaceAuthService,
            ObjectMapper objectMapper
    ) {
        this.groqClient = groqClient;
        this.groqProperties = groqProperties;
        this.promptGuard = promptGuard;
        this.evidenceValidator = evidenceValidator;
        this.commitmentRepository = commitmentRepository;
        this.threadRepository = threadRepository;
        this.emailRepository = emailRepository;
        this.workspaceAuthService = workspaceAuthService;
        this.objectMapper = objectMapper;
    }

    /**
     * Extracts, validates, deduplicates and persists commitments for an authorized thread.
     */
    @Transactional
    public List<EmailCommitmentDto> extractAndSyncCommitments(UUID threadId, UUID workspaceId, User user) {
        workspaceAuthService.validateAccess(workspaceId, user);
        EmailThread thread = threadRepository.findByIdAndWorkspaceId(threadId, workspaceId)
                .orElseThrow(() -> new ResourceNotFoundException("Thread not found: " + threadId));

        List<Email> messages = emailRepository.findByThreadIdOrderBySentAtAsc(threadId);
        String threadContext = buildThreadContextText(thread, messages, user);
        String protectedData = promptGuard.encapsulateUntrustedEmail(threadContext, groqProperties.getMaxInputChars());

        String systemPrompt = promptGuard.getAntiInjectionSystemPrompt(
                "You are an email commitment and action-tracking specialist for small businesses.\n" +
                "Extract all commitments, promises, deliverables, and requested actions into structured JSON with key 'commitments'.\n" +
                "For each commitment:\n" +
                "- 'actor': 'user' if the authenticated user promised it or owes it; 'other' if another person/company promised or owes it; 'unknown' if unclear.\n" +
                "- 'action': Concise, direct description of the obligation.\n" +
                "- 'target': Name or entity to whom it is owed, or null.\n" +
                "- 'dueDate': Explicit deadline in ISO-8601 format (e.g. '2026-11-20T17:00:00Z') or null if not explicitly stated. NEVER invent dates.\n" +
                "- 'evidenceQuote': EXACT quote from the email text proving this obligation.\n" +
                "- 'status': 'open', 'proposed', 'confirmed', 'done', 'cancelled', or 'superseded'.\n" +
                "- 'confidence': Numeric between 0.0 and 1.0."
        );

        GroqChatRequest chatRequest = GroqChatRequest.jsonRequest(
                groqProperties.getModelSummary(),
                List.of(
                        new GroqChatRequest.Message("system", systemPrompt),
                        new GroqChatRequest.Message("user", "Extract commitments and obligations from this thread:\n" + protectedData)
                ),
                0.1,
                1000
        );

        GroqChatResponse response = groqClient.chatCompletion(chatRequest);
        String jsonContent = response.firstChoiceContent();

        List<Map<String, Object>> rawList = parseCommitmentsJson(jsonContent);
        List<EmailCommitment> persisted = new ArrayList<>();

        for (Map<String, Object> map : rawList) {
            String action = map.get("action") != null ? map.get("action").toString().trim() : null;
            if (action == null || action.isBlank()) continue;

            String actor = map.get("actor") != null ? map.get("actor").toString().toLowerCase(Locale.ROOT) : "unknown";
            if (!List.of("user", "other", "unknown").contains(actor)) {
                actor = "unknown";
            }

            String evidenceQuote = map.get("evidenceQuote") != null ? map.get("evidenceQuote").toString().trim() : null;

            // Strict grounding check: evidenceQuote must exist in source email body
            boolean validQuote = evidenceQuote != null && evidenceValidator.isValidEvidence(evidenceQuote, threadContext);
            if (!validQuote && !evidenceValidator.isValidEvidence(action, threadContext)) {
                log.debug("Discarding ungrounded commitment: {}", action);
                continue;
            }

            String target = map.get("target") != null ? map.get("target").toString().trim() : null;
            Instant dueDate = null;
            if (map.get("dueDate") != null) {
                try {
                    dueDate = Instant.parse(map.get("dueDate").toString().trim());
                } catch (DateTimeParseException ignored) {}
            }

            String status = map.get("status") != null ? map.get("status").toString().toLowerCase(Locale.ROOT) : "open";
            double confidence = 0.8;
            if (map.get("confidence") instanceof Number n) {
                confidence = n.doubleValue();
            }

            // Generate stable fingerprint for deduplication
            String fingerprint = generateFingerprint(actor, action);

            // Deduplicate: check existing commitment in this workspace
            Optional<EmailCommitment> existingOpt = commitmentRepository.findByWorkspaceIdAndFingerprint(workspaceId, fingerprint);
            EmailCommitment commitment;
            if (existingOpt.isPresent()) {
                commitment = existingOpt.get();
                // Update dueDate or quote if newly discovered and not overridden by user
                if (dueDate != null && commitment.getDueDate() == null) {
                    commitment.setDueDate(dueDate);
                }
                if (commitment.getEvidenceQuote() == null && evidenceQuote != null) {
                    commitment.setEvidenceQuote(evidenceQuote);
                }
            } else {
                commitment = new EmailCommitment(thread, thread.getWorkspace(), actor, action, fingerprint);
                commitment.setTarget(target);
                commitment.setDueDate(dueDate);
                commitment.setEvidenceQuote(evidenceQuote != null ? evidenceQuote : action);
                commitment.setStatus(status);
                commitment.setConfidence(confidence);
                if (messages != null && !messages.isEmpty()) {
                    commitment.setSourceMessageId(messages.get(messages.size() - 1).getExternalMessageId());
                }
            }

            commitment = commitmentRepository.save(commitment);
            persisted.add(commitment);
        }

        return persisted.stream().map(this::toDto).toList();
    }

    /**
     * Lists all commitments in a workspace, optionally filtered by status or actor.
     */
    @Transactional(readOnly = true)
    public List<EmailCommitmentDto> getWorkspaceCommitments(UUID workspaceId, User user, String status, String actor) {
        workspaceAuthService.validateAccess(workspaceId, user);

        List<EmailCommitment> commitments;
        if (status != null && !status.isBlank()) {
            commitments = commitmentRepository.findByWorkspaceIdAndStatus(workspaceId, status.toLowerCase(Locale.ROOT));
        } else if (actor != null && !actor.isBlank()) {
            commitments = commitmentRepository.findByWorkspaceIdAndActorAndStatuses(
                    workspaceId,
                    actor.toLowerCase(Locale.ROOT),
                    List.of("open", "proposed", "confirmed", "needs_review")
            );
        } else {
            commitments = commitmentRepository.findActiveCommitments(
                    workspaceId,
                    List.of("open", "proposed", "confirmed", "needs_review")
            );
        }

        return commitments.stream().map(this::toDto).toList();
    }

    /**
     * Retrieves commitments for a specific thread.
     */
    @Transactional(readOnly = true)
    public List<EmailCommitmentDto> getThreadCommitments(UUID threadId, UUID workspaceId, User user) {
        workspaceAuthService.validateAccess(workspaceId, user);
        List<EmailCommitment> list = commitmentRepository.findByThreadId(threadId);
        return list.stream().map(this::toDto).toList();
    }

    /**
     * Updates the status of a commitment with an audit trail note.
     */
    @Transactional
    public EmailCommitmentDto updateCommitmentStatus(UUID commitmentId, UUID workspaceId, User user, CommitmentStatusUpdateRequest request) {
        workspaceAuthService.validateAccess(workspaceId, user);

        EmailCommitment commitment = commitmentRepository.findById(commitmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Commitment not found: " + commitmentId));

        if (!commitment.getWorkspace().getId().equals(workspaceId)) {
            throw new ResourceNotFoundException("Commitment does not belong to specified workspace");
        }

        String newStatus = request.status().toLowerCase(Locale.ROOT).trim();
        commitment.setUserStatusOverride(newStatus);
        if (request.auditNote() != null && !request.auditNote().isBlank()) {
            commitment.setAuditNote(request.auditNote().trim());
        }

        EmailCommitment saved = commitmentRepository.save(commitment);
        return toDto(saved);
    }

    public EmailCommitmentDto toDto(EmailCommitment c) {
        return new EmailCommitmentDto(
                c.getId(),
                c.getThread().getId(),
                c.getThread().getSubject(),
                c.getSourceMessageId(),
                c.getActor(),
                c.getAction(),
                c.getTarget(),
                c.getDueDate() != null ? c.getDueDate().toString() : null,
                c.getEvidenceQuote(),
                c.getStatus(),
                c.getUserStatusOverride(),
                c.getEffectiveStatus(),
                c.getAuditNote(),
                c.getConfidence(),
                c.getCreatedAt() != null ? c.getCreatedAt().toString() : null
        );
    }

    private String generateFingerprint(String actor, String action) {
        String normalizedAction = action.toLowerCase(Locale.ROOT)
                .replaceAll("[^a-z0-9\\s]", "")
                .replaceAll("\\s+", " ")
                .trim();
        if (normalizedAction.length() > 200) {
            normalizedAction = normalizedAction.substring(0, 200);
        }
        return actor.toLowerCase(Locale.ROOT) + ":" + normalizedAction;
    }

    private String buildThreadContextText(EmailThread thread, List<Email> messages, User user) {
        StringBuilder sb = new StringBuilder();
        sb.append("Authenticated User: ").append(user.getFullName()).append(" <").append(user.getEmail()).append(">\n");
        sb.append("Subject: ").append(thread.getSubject()).append("\n");
        sb.append("Sender: ").append(thread.getSenderName()).append(" <").append(thread.getSenderEmail()).append(">\n\n");

        if (messages != null && !messages.isEmpty()) {
            for (Email msg : messages) {
                sb.append("--- Message from: ").append(msg.getSenderName()).append(" <").append(msg.getSenderEmail()).append("> ---\n");
                sb.append(msg.getBodyText() != null ? msg.getBodyText() : msg.getSnippet()).append("\n\n");
            }
        } else {
            sb.append(thread.getSnippet()).append("\n");
        }

        return sb.toString();
    }

    private List<Map<String, Object>> parseCommitmentsJson(String jsonContent) {
        try {
            Map<String, Object> root = objectMapper.readValue(jsonContent, new TypeReference<>() {});
            if (root.get("commitments") instanceof List<?> list) {
                List<Map<String, Object>> result = new ArrayList<>();
                for (Object item : list) {
                    if (item instanceof Map<?, ?> m) {
                        Map<String, Object> casted = new HashMap<>();
                        m.forEach((k, v) -> {
                            if (k != null) casted.put(k.toString(), v);
                        });
                        result.add(casted);
                    }
                }
                return result;
            }
        } catch (Exception e) {
            log.warn("Failed to parse commitments JSON from model: {}", e.getMessage());
        }
        return List.of();
    }
}

