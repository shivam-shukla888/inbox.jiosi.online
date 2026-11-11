package com.jiosi.inbox.ai.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.jiosi.inbox.ai.client.GroqClient;
import com.jiosi.inbox.ai.config.GroqProperties;
import com.jiosi.inbox.ai.dto.*;
import com.jiosi.inbox.ai.entity.ThreadAiTriage;
import com.jiosi.inbox.ai.entity.UserAiPreferences;
import com.jiosi.inbox.ai.repository.ThreadAiTriageRepository;
import com.jiosi.inbox.ai.repository.UserAiPreferencesRepository;
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
import java.util.stream.Collectors;

@Service
public class EmailIntelligenceService {

    private static final Logger log = LoggerFactory.getLogger(EmailIntelligenceService.class);

    private final GroqClient groqClient;
    private final GroqProperties groqProperties;
    private final PromptInjectionGuard promptGuard;
    private final EvidenceValidator evidenceValidator;
    private final ScoringEngine scoringEngine;
    private final EmailThreadRepository threadRepository;
    private final EmailRepository emailRepository;
    private final ThreadAiTriageRepository triageRepository;
    private final UserAiPreferencesRepository preferencesRepository;
    private final WorkspaceAuthorizationService workspaceAuthService;
    private final ObjectMapper objectMapper;
    private final BusinessProfileService profileService;

    public EmailIntelligenceService(
            GroqClient groqClient,
            GroqProperties groqProperties,
            PromptInjectionGuard promptGuard,
            EvidenceValidator evidenceValidator,
            ScoringEngine scoringEngine,
            EmailThreadRepository threadRepository,
            EmailRepository emailRepository,
            ThreadAiTriageRepository triageRepository,
            UserAiPreferencesRepository preferencesRepository,
            WorkspaceAuthorizationService workspaceAuthService,
            ObjectMapper objectMapper
    ) {
        this(groqClient, groqProperties, promptGuard, evidenceValidator, scoringEngine,
                threadRepository, emailRepository, triageRepository, preferencesRepository,
                workspaceAuthService, objectMapper, null);
    }

    @org.springframework.beans.factory.annotation.Autowired
    public EmailIntelligenceService(
            GroqClient groqClient,
            GroqProperties groqProperties,
            PromptInjectionGuard promptGuard,
            EvidenceValidator evidenceValidator,
            ScoringEngine scoringEngine,
            EmailThreadRepository threadRepository,
            EmailRepository emailRepository,
            ThreadAiTriageRepository triageRepository,
            UserAiPreferencesRepository preferencesRepository,
            WorkspaceAuthorizationService workspaceAuthService,
            ObjectMapper objectMapper,
            @org.springframework.beans.factory.annotation.Autowired(required = false) BusinessProfileService profileService
    ) {
        this.groqClient = groqClient;
        this.groqProperties = groqProperties;
        this.promptGuard = promptGuard;
        this.evidenceValidator = evidenceValidator;
        this.scoringEngine = scoringEngine;
        this.threadRepository = threadRepository;
        this.emailRepository = emailRepository;
        this.triageRepository = triageRepository;
        this.preferencesRepository = preferencesRepository;
        this.workspaceAuthService = workspaceAuthService;
        this.objectMapper = objectMapper;
        this.profileService = profileService;
    }

    /**
     * Checks if user has granted AI processing consent.
     * Enforces strict explicit opt-in: returns false if preferences are missing,
     * repository is null, or repository access fails.
     */
    public boolean hasUserConsent(User user) {
        if (user == null || preferencesRepository == null) {
            return false;
        }
        try {
            return preferencesRepository.findByUserId(user.getId())
                    .map(UserAiPreferences::isAiProcessingConsent)
                    .orElse(false); // Strict explicit opt-in: false by default
        } catch (Exception e) {
            log.warn("Failed to check user AI consent from repository, failing closed: {}", e.getMessage());
            return false;
        }
    }

    /**
     * Generates a concise summary for an authorized thread.
     */
    @Transactional
    public ThreadSummaryResponse summarizeThread(UUID threadId, UUID workspaceId, User user) {
        assertUserConsent(user);
        EmailThread thread = validateAndGetThread(threadId, workspaceId, user);
        List<Email> messages = emailRepository.findByThreadIdOrderBySentAtAsc(threadId);

        String contextText = buildThreadContextText(thread, messages);
        String protectedData = promptGuard.encapsulateUntrustedEmail(contextText, groqProperties.getMaxInputChars());

        String systemPrompt = promptGuard.getAntiInjectionSystemPrompt(
                "Your task is to summarize this email conversation into structured JSON with these keys:\n" +
                "- 'gist': A single concise sentence summarizing the main topic.\n" +
                "- 'keyDecisions': An array of strings containing explicit decisions made or key facts confirmed.\n" +
                "- 'openQuestion': A single string describing any outstanding question or response requested, or null if none.\n" +
                "- 'explicitDeadline': A string with any explicit deadline mentioned in the email, or null if none.\n" +
                "- 'suggestedNextAction': A clear actionable recommendation for the recipient (labeled as a suggestion)."
        );

        GroqChatRequest request = GroqChatRequest.jsonRequest(
                groqProperties.getModelSummary(),
                List.of(
                        new GroqChatRequest.Message("system", systemPrompt),
                        new GroqChatRequest.Message("user", "Summarize the following email conversation:\n" + protectedData)
                ),
                0.1,
                1000
        );

        GroqChatResponse response = groqClient.chatCompletion(request);
        String jsonContent = response.firstChoiceContent();

        ThreadSummaryResponse summary = parseSummaryResponse(jsonContent);

        // Update cached summary on thread
        if (summary != null && summary.gist() != null && !summary.gist().isBlank()) {
            thread.setAiSummary(summary.gist());
            threadRepository.save(thread);
        }

        return summary;
    }

    /**
     * Extracts structured action items from an authorized thread.
     */
    @Transactional(readOnly = true)
    public List<ActionItemDto> extractActionItems(UUID threadId, UUID workspaceId, User user) {
        assertUserConsent(user);
        EmailThread thread = validateAndGetThread(threadId, workspaceId, user);
        List<Email> messages = emailRepository.findByThreadIdOrderBySentAtAsc(threadId);

        String contextText = buildThreadContextText(thread, messages);
        String protectedData = promptGuard.encapsulateUntrustedEmail(contextText, groqProperties.getMaxInputChars());

        String systemPrompt = promptGuard.getAntiInjectionSystemPrompt(
                "Your task is to extract actionable tasks or commitments from the email into structured JSON with key 'items'.\n" +
                "Each item must have:\n" +
                "- 'title': Concise description of the action.\n" +
                "- 'owner': Name or email of the person assigned, or null if not explicitly stated.\n" +
                "- 'dueDate': Explicit deadline if stated in text, or null. Do not invent dates.\n" +
                "- 'evidenceQuote': Exact quote from the email text proving this action was requested.\n" +
                "- 'confidence': Numeric confidence score from 0.0 to 1.0."
        );

        GroqChatRequest request = GroqChatRequest.jsonRequest(
                groqProperties.getModelSummary(),
                List.of(
                        new GroqChatRequest.Message("system", systemPrompt),
                        new GroqChatRequest.Message("user", "Extract action items from this conversation:\n" + protectedData)
                ),
                0.1,
                1000
        );

        GroqChatResponse response = groqClient.chatCompletion(request);
        String jsonContent = response.firstChoiceContent();

        List<ActionItemDto> rawItems = parseActionItemsResponse(jsonContent);

        // Verify and filter evidence quotes against source text
        List<ActionItemDto> verifiedItems = new ArrayList<>();
        for (ActionItemDto item : rawItems) {
            if (item.evidenceQuote() != null && evidenceValidator.isValidEvidence(item.evidenceQuote(), contextText)) {
                verifiedItems.add(item);
            } else if (item.evidenceQuote() == null || item.evidenceQuote().isBlank()) {
                // If model omitted quote but title is grounded in text
                if (evidenceValidator.isValidEvidence(item.title(), contextText)) {
                    verifiedItems.add(new ActionItemDto(item.title(), item.owner(), item.dueDate(), item.title(), item.confidence()));
                }
            }
        }

        return verifiedItems;
    }

    /**
     * Generates a contextual reply draft grounded strictly in the thread's facts.
     */
    @Transactional(readOnly = true)
    public ReplyDraftResponse generateReplyDraft(UUID threadId, UUID workspaceId, User user, ReplyDraftRequest request) {
        assertUserConsent(user);
        EmailThread thread = validateAndGetThread(threadId, workspaceId, user);
        List<Email> messages = emailRepository.findByThreadIdOrderBySentAtAsc(threadId);

        String contextText = buildThreadContextText(thread, messages);
        String protectedData = promptGuard.encapsulateUntrustedEmail(contextText, groqProperties.getMaxInputChars());

        String tone = request.tone() != null ? request.tone().toLowerCase(Locale.ROOT) : "professional";
        String language = request.language() != null ? request.language() : "match_thread";
        String custom = request.customInstructions() != null ? request.customInstructions().trim() : "";

        String languageInstruction = switch (language) {
            case "hi" -> "Draft the reply in clear Hindi (Devanagari or professional Hinglish depending on context).";
            case "en" -> "Draft the reply in fluent English.";
            default -> "Draft the reply in the same primary language as the thread.";
        };

        String toneInstruction = switch (tone) {
            case "friendly" -> "Tone: Warm, collaborative, friendly, and approachable.";
            case "concise" -> "Tone: Ultra-concise, direct, bulleted if helpful, no filler words.";
            default -> "Tone: Professional, polished, courteous, and business-ready.";
        };

        String systemPrompt = promptGuard.getAntiInjectionSystemPrompt(
                "You are drafting an email reply for the user (" + user.getFullName() + ", email: " + user.getEmail() + ").\n" +
                toneInstruction + "\n" +
                languageInstruction + "\n" +
                "RULES:\n" +
                "- Ground the draft ONLY in facts from the email thread or user instructions.\n" +
                "- Do NOT promise a deadline, accept contract terms, or claim work is done unless context explicitly states so.\n" +
                "- Do NOT invent phone numbers, addresses, or commitments.\n" +
                "- Provide only the body of the reply. Do not include metadata headers like 'Subject:' or 'To:'."
        );

        String userPrompt = "Generate a reply draft to this thread.\n" +
                (custom.isEmpty() ? "" : "User-specified notes: " + custom + "\n") +
                protectedData;

        GroqChatRequest chatRequest = GroqChatRequest.textRequest(
                groqProperties.getModelDraft(),
                List.of(
                        new GroqChatRequest.Message("system", systemPrompt),
                        new GroqChatRequest.Message("user", userPrompt)
                ),
                0.2,
                800
        );

        GroqChatResponse response = groqClient.chatCompletion(chatRequest);
        String draftText = response.firstChoiceContent().trim();

        return new ReplyDraftResponse(draftText, tone, language);
    }

    /**
     * Assists in composing, rewriting, shortening, tone adjusting, or translating text.
     */
    public ComposeAssistResponse assistCompose(ComposeAssistRequest request, User user) {
        assertUserConsent(user);

        String currentText = request.currentText();
        String action = request.action().toLowerCase(Locale.ROOT);
        String targetLanguage = request.targetLanguage();
        String instructions = request.instructions() != null ? request.instructions() : "";

        String actionDescription = switch (action) {
            case "shorten" -> "Condense this text while keeping the core meaning and any commitments intact.";
            case "tone_friendly" -> "Rewrite this email text in a warm, friendly, collaborative tone.";
            case "tone_professional" -> "Rewrite this email text in a polished, articulate, professional business tone.";
            case "tone_concise" -> "Rewrite this email text to be direct, brief, and punchy.";
            case "fix_grammar" -> "Correct any grammar, spelling, and phrasing errors without altering the core tone.";
            case "translate" -> "Translate this text accurately to " + (targetLanguage != null && targetLanguage.equalsIgnoreCase("hi") ? "Hindi" : "English") + ".";
            default -> "Rewrite and refine this email text for clarity and impact.";
        };

        String systemPrompt = promptGuard.getAntiInjectionSystemPrompt(
                "You are an email composition assistant.\n" +
                actionDescription + "\n" +
                "Return structured JSON with keys:\n" +
                "- 'suggestedText': The refined/translated version.\n" +
                "- 'explanation': Brief note of what was improved."
        );

        GroqChatRequest chatRequest = GroqChatRequest.jsonRequest(
                groqProperties.getModelDraft(),
                List.of(
                        new GroqChatRequest.Message("system", systemPrompt),
                        new GroqChatRequest.Message("user", "Text to refine:\n" + currentText + (instructions.isEmpty() ? "" : "\nAdditional instructions: " + instructions))
                ),
                0.2,
                1000
        );

        GroqChatResponse response = groqClient.chatCompletion(chatRequest);
        String jsonContent = response.firstChoiceContent();

        try {
            Map<String, String> map = objectMapper.readValue(jsonContent, new TypeReference<>() {});
            String suggested = map.getOrDefault("suggestedText", currentText);
            String explanation = map.getOrDefault("explanation", "Refined text applied.");
            return new ComposeAssistResponse(currentText, suggested, action, explanation);
        } catch (Exception e) {
            log.warn("Failed to parse compose assist JSON response, falling back to raw output");
            return new ComposeAssistResponse(currentText, jsonContent.trim(), action, "Refined text applied.");
        }
    }

    /**
     * Analyzes and classifies an email thread for category, importance, urgency, and spam detection.
     */
    @Transactional
    public TriageClassificationResponse triageThread(UUID threadId, UUID workspaceId, User user) {
        assertUserConsent(user);
        EmailThread thread = validateAndGetThread(threadId, workspaceId, user);
        List<Email> messages = emailRepository.findByThreadIdOrderBySentAtAsc(threadId);

        String contextText = buildThreadContextText(thread, messages);
        String protectedData = promptGuard.encapsulateUntrustedEmail(contextText, groqProperties.getMaxInputChars());

        // Call Groq with classification prompt
        String systemPrompt = promptGuard.getAntiInjectionSystemPrompt(
                "You are an email classification and triage model for JIOSI Inbox.\n" +
                "Analyze the email conversation and output structured JSON with keys:\n" +
                "- 'categorySuggestion': One of ['primary', 'transactional', 'newsletter', 'promotional', 'social', 'suspicious', 'spam', 'unknown'].\n" +
                "- 'explicitDeadline': An explicit deadline in ISO-8601 format (e.g. '2026-11-15T14:00:00Z') or null if no exact date/time is stated in text.\n" +
                "- 'evidence': Array of exact quotes from the text explaining your classification.\n" +
                "- 'confidence': Float between 0.0 and 1.0."
        );

        GroqChatRequest chatRequest = GroqChatRequest.jsonRequest(
                groqProperties.getModelClassify(),
                List.of(
                        new GroqChatRequest.Message("system", systemPrompt),
                        new GroqChatRequest.Message("user", "Classify this email thread:\n" + protectedData)
                ),
                0.1,
                800
        );

        GroqChatResponse chatResponse = groqClient.chatCompletion(chatRequest);
        String jsonContent = chatResponse.firstChoiceContent();

        String modelCategory = "primary";
        Instant parsedDeadline = null;
        List<String> rawEvidence = new ArrayList<>();
        double confidence = 0.85;

        try {
            Map<String, Object> map = objectMapper.readValue(jsonContent, new TypeReference<>() {});
            if (map.get("categorySuggestion") != null) {
                modelCategory = map.get("categorySuggestion").toString();
            }
            if (map.get("explicitDeadline") != null && !map.get("explicitDeadline").toString().isBlank()) {
                try {
                    parsedDeadline = Instant.parse(map.get("explicitDeadline").toString());
                } catch (DateTimeParseException ignored) {}
            }
            if (map.get("evidence") instanceof List<?> list) {
                for (Object item : list) {
                    if (item != null) rawEvidence.add(item.toString());
                }
            }
            if (map.get("confidence") instanceof Number n) {
                confidence = n.doubleValue();
            }
        } catch (Exception e) {
            log.warn("Error parsing triage JSON from model: {}", e.getMessage());
        }

        // Validate evidence quotes against source text
        List<String> verifiedEvidence = evidenceValidator.filterValidEvidence(rawEvidence, contextText);

        // Check Gmail provider metadata
        boolean hasGmailSpam = thread.getTags() != null && thread.getTags().contains("SPAM");
        boolean hasListUnsubscribe = thread.getSnippet() != null && thread.getSnippet().toLowerCase(Locale.ROOT).contains("unsubscribe");

        boolean isVip = false;
        String profileType = "generic";
        String timezone = "UTC";
        if (profileService != null) {
            try {
                com.jiosi.inbox.ai.entity.UserBusinessProfile profile = profileService.getOrCreateProfile(user, workspaceId);
                isVip = profileService.isVipContact(thread.getSenderEmail(), profile);
                profileType = profile.getProfileType();
                timezone = profile.getTimezone();
            } catch (Exception ignored) {}
        }

        // Run scoring engine
        ScoringEngine.TriageScores scores = scoringEngine.calculateScores(
                thread,
                messages,
                user.getEmail(),
                List.of(),
                parsedDeadline,
                modelCategory,
                hasGmailSpam,
                hasListUnsubscribe,
                isVip,
                profileType,
                timezone,
                Instant.now()
        );

        // Update or create ThreadAiTriage record
        ThreadAiTriage triage = triageRepository.findByThreadIdAndWorkspaceId(threadId, workspaceId)
                .orElseGet(() -> new ThreadAiTriage(thread, thread.getWorkspace()));

        triage.setCategory(scores.category());
        triage.setImportanceScore(scores.importanceScore());
        triage.setImportanceReason(scores.importanceReason());
        triage.setUrgencyScore(scores.urgencyScore());
        triage.setUrgencyReason(scores.urgencyReason());
        triage.setNeedsReply(scores.needsReply());
        triage.setDeadline(scores.deadline());
        triage.setConfidence(confidence);
        triage.setModelUsed(groqProperties.getModelClassify());

        try {
            triage.setEvidence(objectMapper.writeValueAsString(verifiedEvidence));
        } catch (JsonProcessingException e) {
            triage.setEvidence("[]");
        }

        triageRepository.save(triage);

        // Update thread's needs-reply flag if newly suggested
        if (scores.needsReply() && !thread.isNeedsReply()) {
            thread.setNeedsReply(true);
            threadRepository.save(thread);
        }

        return toDto(triage, verifiedEvidence);
    }

    /**
     * Records user correction or feedback for an email's triage classification.
     */
    @Transactional
    public TriageClassificationResponse correctTriage(UUID threadId, UUID workspaceId, User user, TriageCorrectionRequest request) {
        workspaceAuthService.validateAccess(workspaceId, user);

        ThreadAiTriage triage = triageRepository.findByThreadIdAndWorkspaceId(threadId, workspaceId)
                .orElseThrow(() -> new ResourceNotFoundException("Triage data not found for thread " + threadId));

        triage.setUserCategoryOverride(request.correctedCategory());
        triage.setFeedbackReported(true);
        if (request.feedbackNotes() != null && !request.feedbackNotes().isBlank()) {
            triage.setFeedbackNotes(request.feedbackNotes().trim());
        }

        triageRepository.save(triage);

        List<String> evidence = parseEvidenceList(triage.getEvidence());
        return toDto(triage, evidence);
    }

    /**
     * Gets user AI preferences and consent status.
     * Enforces strict explicit opt-in: defaults to false if not found.
     */
    @Transactional(readOnly = true)
    public UserAiPreferencesDto getPreferences(User user) {
        if (preferencesRepository == null) {
            return new UserAiPreferencesDto(false, "professional", "match_thread", groqProperties.isEnabled());
        }
        UserAiPreferences prefs;
        try {
            prefs = preferencesRepository.findByUserId(user.getId())
                    .orElseGet(() -> new UserAiPreferences(user.getId(), false, "professional", "match_thread"));
        } catch (Exception e) {
            log.warn("Failed to load user preferences from repository, defaulting to explicit false: {}", e.getMessage());
            return new UserAiPreferencesDto(false, "professional", "match_thread", groqProperties.isEnabled());
        }

        return new UserAiPreferencesDto(
                prefs.isAiProcessingConsent(),
                prefs.getDefaultReplyTone(),
                prefs.getDefaultReplyLanguage(),
                groqProperties.isEnabled()
        );
    }

    /**
     * Updates user AI preferences and consent status.
     */
    @Transactional
    public UserAiPreferencesDto updatePreferences(User user, boolean consent, String defaultTone, String defaultLanguage) {
        UserAiPreferences prefs = preferencesRepository.findByUserId(user.getId())
                .orElseGet(() -> new UserAiPreferences(user.getId(), consent, defaultTone, defaultLanguage));

        prefs.setAiProcessingConsent(consent);
        if (defaultTone != null && !defaultTone.isBlank()) {
            prefs.setDefaultReplyTone(defaultTone);
        }
        if (defaultLanguage != null && !defaultLanguage.isBlank()) {
            prefs.setDefaultReplyLanguage(defaultLanguage);
        }

        preferencesRepository.save(prefs);

        return new UserAiPreferencesDto(
                prefs.isAiProcessingConsent(),
                prefs.getDefaultReplyTone(),
                prefs.getDefaultReplyLanguage(),
                groqProperties.isEnabled()
        );
    }

    // Helper methods
    public void assertUserConsent(User user) {
        if (!hasUserConsent(user)) {
            throw new AiConsentRequiredException("AI processing is disabled in your privacy settings. Enable it in Settings > Privacy to use AI features.");
        }
    }

    private EmailThread validateAndGetThread(UUID threadId, UUID workspaceId, User user) {
        workspaceAuthService.validateAccess(workspaceId, user);
        return threadRepository.findByIdAndWorkspaceId(threadId, workspaceId)
                .orElseThrow(() -> new ResourceNotFoundException("Thread not found or access denied: " + threadId));
    }

    private String buildThreadContextText(EmailThread thread, List<Email> messages) {
        StringBuilder sb = new StringBuilder();
        sb.append("Subject: ").append(thread.getSubject()).append("\n");
        sb.append("Participants: ").append(thread.getSenderName()).append(" <").append(thread.getSenderEmail()).append(">");
        if (thread.getRecipientEmail() != null) {
            sb.append(", Recipient: ").append(thread.getRecipientEmail());
        }
        sb.append("\n\nMessages:\n");

        if (messages != null && !messages.isEmpty()) {
            for (Email msg : messages) {
                sb.append("--- From: ").append(msg.getSenderName()).append(" <").append(msg.getSenderEmail()).append("> ---\n");
                sb.append(msg.getBodyText() != null ? msg.getBodyText() : msg.getSnippet()).append("\n\n");
            }
        } else {
            sb.append(thread.getSnippet()).append("\n");
        }

        return sb.toString();
    }

    private ThreadSummaryResponse parseSummaryResponse(String jsonContent) {
        try {
            return objectMapper.readValue(jsonContent, ThreadSummaryResponse.class);
        } catch (Exception e) {
            log.warn("Failed to parse summary response JSON, generating fallback representation");
            return new ThreadSummaryResponse(
                    "Conversation regarding email thread.",
                    List.of(),
                    null,
                    null,
                    "Review message details."
            );
        }
    }

    private List<ActionItemDto> parseActionItemsResponse(String jsonContent) {
        try {
            ActionItemDto.ActionItemsList list = objectMapper.readValue(jsonContent, ActionItemDto.ActionItemsList.class);
            return list.items();
        } catch (Exception e) {
            log.warn("Failed to parse action items JSON: {}", e.getMessage());
            return List.of();
        }
    }

    private List<String> parseEvidenceList(String evidenceJson) {
        if (evidenceJson == null || evidenceJson.isBlank()) {
            return List.of();
        }
        try {
            return objectMapper.readValue(evidenceJson, new TypeReference<>() {});
        } catch (Exception e) {
            return List.of();
        }
    }

    private TriageClassificationResponse toDto(ThreadAiTriage triage, List<String> evidence) {
        return new TriageClassificationResponse(
                triage.getCategory(),
                triage.getImportanceScore(),
                triage.getImportanceReason(),
                triage.getUrgencyScore(),
                triage.getUrgencyReason(),
                triage.isNeedsReply(),
                triage.getDeadline() != null ? triage.getDeadline().toString() : null,
                evidence,
                triage.getConfidence(),
                triage.getUserCategoryOverride()
        );
    }

    public static class AiConsentRequiredException extends RuntimeException {
        public AiConsentRequiredException(String message) { super(message); }
    }
}

