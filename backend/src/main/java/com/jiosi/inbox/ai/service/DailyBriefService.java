package com.jiosi.inbox.ai.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.jiosi.inbox.ai.dto.DailyBriefItemDto;
import com.jiosi.inbox.ai.dto.DailyBriefResponse;
import com.jiosi.inbox.ai.entity.DailyBriefCache;
import com.jiosi.inbox.ai.entity.EmailCommitment;
import com.jiosi.inbox.ai.entity.ThreadAiTriage;
import com.jiosi.inbox.ai.entity.UserBusinessProfile;
import com.jiosi.inbox.ai.repository.DailyBriefCacheRepository;
import com.jiosi.inbox.ai.repository.EmailCommitmentRepository;
import com.jiosi.inbox.ai.repository.ThreadAiTriageRepository;
import com.jiosi.inbox.email.Email;
import com.jiosi.inbox.email.EmailRepository;
import com.jiosi.inbox.email.EmailThread;
import com.jiosi.inbox.email.EmailThreadRepository;
import com.jiosi.inbox.security.WorkspaceAuthorizationService;
import com.jiosi.inbox.user.User;
import com.jiosi.inbox.workspace.Workspace;
import com.jiosi.inbox.workspace.WorkspaceRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class DailyBriefService {

    private static final Logger log = LoggerFactory.getLogger(DailyBriefService.class);

    private final EmailThreadRepository threadRepository;
    private final EmailRepository emailRepository;
    private final ThreadAiTriageRepository triageRepository;
    private final EmailCommitmentRepository commitmentRepository;
    private final DailyBriefCacheRepository cacheRepository;
    private final BusinessProfileService profileService;
    private final ScoringEngine scoringEngine;
    private final WorkspaceAuthorizationService workspaceAuthService;
    private final WorkspaceRepository workspaceRepository;
    private final ObjectMapper objectMapper;

    public DailyBriefService(
            EmailThreadRepository threadRepository,
            EmailRepository emailRepository,
            ThreadAiTriageRepository triageRepository,
            EmailCommitmentRepository commitmentRepository,
            DailyBriefCacheRepository cacheRepository,
            BusinessProfileService profileService,
            ScoringEngine scoringEngine,
            WorkspaceAuthorizationService workspaceAuthService,
            WorkspaceRepository workspaceRepository,
            ObjectMapper objectMapper
    ) {
        this.threadRepository = threadRepository;
        this.emailRepository = emailRepository;
        this.triageRepository = triageRepository;
        this.commitmentRepository = commitmentRepository;
        this.cacheRepository = cacheRepository;
        this.profileService = profileService;
        this.scoringEngine = scoringEngine;
        this.workspaceAuthService = workspaceAuthService;
        this.workspaceRepository = workspaceRepository;
        this.objectMapper = objectMapper;
    }

    /**
     * Generates or retrieves the cached daily business brief for the user and workspace.
     */
    @Transactional
    public DailyBriefResponse getDailyBrief(UUID workspaceId, User user, boolean forceRefresh) {
        workspaceAuthService.validateAccess(workspaceId, user);
        UserBusinessProfile profile = profileService.getOrCreateProfile(user, workspaceId);

        ZoneId userZone;
        try {
            userZone = ZoneId.of(profile.getTimezone());
        } catch (Exception e) {
            userZone = ZoneId.of("UTC");
        }

        LocalDate todayDate = LocalDate.now(userZone);
        String briefDateStr = todayDate.toString();

        if (!forceRefresh) {
            Optional<DailyBriefCache> cached = cacheRepository.findByUserIdAndWorkspaceIdAndBriefDate(user.getId(), workspaceId, briefDateStr);
            if (cached.isPresent()) {
                try {
                    return objectMapper.readValue(cached.get().getBriefJson(), DailyBriefResponse.class);
                } catch (Exception e) {
                    log.warn("Failed to deserialize cached daily brief: {}", e.getMessage());
                }
            }
        }

        // Generate fresh daily brief
        DailyBriefResponse freshBrief = computeDailyBrief(workspaceId, user, profile, userZone, briefDateStr);

        // Cache brief
        try {
            String json = objectMapper.writeValueAsString(freshBrief);
            Optional<DailyBriefCache> existingCache = cacheRepository.findByUserIdAndWorkspaceIdAndBriefDate(user.getId(), workspaceId, briefDateStr);
            DailyBriefCache cacheEntity = existingCache.orElseGet(() -> {
                Workspace ws = workspaceRepository.findById(workspaceId).orElseThrow();
                return new DailyBriefCache(user.getId(), ws, briefDateStr, json);
            });
            cacheEntity.setBriefJson(json);
            cacheEntity.setGeneratedAt(Instant.now());
            cacheRepository.save(cacheEntity);
        } catch (JsonProcessingException e) {
            log.error("Failed to serialize daily brief for caching: {}", e.getMessage());
        }

        return freshBrief;
    }

    private DailyBriefResponse computeDailyBrief(UUID workspaceId, User user, UserBusinessProfile profile, ZoneId userZone, String briefDateStr) {
        // Fetch active threads in workspace (inbox, unread, needs reply)
        List<EmailThread> activeThreads = threadRepository.findInboxAll(workspaceId, PageRequest.of(0, 50)).getContent();

        // Fetch open commitments in workspace
        List<EmailCommitment> openCommitments = commitmentRepository.findActiveCommitments(
                workspaceId,
                List.of("open", "proposed", "confirmed", "needs_review")
        );

        Map<UUID, List<EmailCommitment>> commitmentsByThread = openCommitments.stream()
                .collect(Collectors.groupingBy(c -> c.getThread().getId()));

        Set<UUID> assignedThreads = new HashSet<>();
        List<DailyBriefItemDto> needsYouToday = new ArrayList<>();
        List<DailyBriefItemDto> waitingOnSomeoneElse = new ArrayList<>();
        List<DailyBriefItemDto> promisesYouMade = new ArrayList<>();
        List<DailyBriefItemDto> importantNotUrgent = new ArrayList<>();
        List<DailyBriefItemDto> newslettersBulk = new ArrayList<>();
        List<DailyBriefItemDto> possibleSpamOrSuspicious = new ArrayList<>();

        Instant now = Instant.now();
        LocalDate todayLocal = LocalDate.now(userZone);

        for (EmailThread thread : activeThreads) {
            UUID tid = thread.getId();
            List<Email> messages = emailRepository.findByThreadIdOrderBySentAtAsc(tid);
            List<EmailCommitment> threadCommitments = commitmentsByThread.getOrDefault(tid, List.of());

            // Triage lookup or computation
            ThreadAiTriage triage = triageRepository.findByThreadIdAndWorkspaceId(tid, workspaceId).orElse(null);

            boolean isVip = profileService.isVipContact(thread.getSenderEmail(), profile);
            int importance;
            int urgency;
            String category;
            String reason;
            Instant deadline = null;

            if (triage != null) {
                category = triage.getEffectiveCategory();
                importance = triage.getImportanceScore();
                urgency = triage.getUrgencyScore();
                reason = triage.getImportanceReason();
                deadline = triage.getDeadline();
            } else {
                boolean hasGmailSpam = thread.getTags() != null && thread.getTags().contains("SPAM");
                boolean hasUnsub = thread.getSnippet() != null && thread.getSnippet().toLowerCase(Locale.ROOT).contains("unsubscribe");
                ScoringEngine.TriageScores scores = scoringEngine.calculateScores(
                        thread,
                        messages,
                        user.getEmail(),
                        List.of(),
                        null,
                        "primary",
                        hasGmailSpam,
                        hasUnsub,
                        isVip,
                        profile.getProfileType(),
                        profile.getTimezone(),
                        now
                );
                category = scores.category();
                importance = scores.importanceScore();
                urgency = scores.urgencyScore();
                reason = scores.importanceReason();
                deadline = scores.deadline();
            }

            // Determine who owes next step
            String whoOwesNext = determineWhoOwesNext(thread, messages, user, threadCommitments);

            // Check if deadline is today
            boolean dueToday = false;
            if (deadline != null) {
                ZonedDateTime deadlineLocal = deadline.atZone(userZone);
                dueToday = deadlineLocal.toLocalDate().isEqual(todayLocal);
            }

            String nextAction = suggestNextAction(category, whoOwesNext, dueToday, threadCommitments);

            DailyBriefItemDto item = new DailyBriefItemDto(
                    thread.getId(),
                    thread.getExternalThreadId(),
                    thread.getSubject(),
                    thread.getSenderName(),
                    thread.getSenderEmail(),
                    reason != null ? reason : "Direct correspondence",
                    deadline != null ? deadline.toString() : (dueToday ? "Due Today" : null),
                    nextAction,
                    category,
                    importance,
                    urgency,
                    whoOwesNext,
                    thread.getLastMessageAt() != null ? thread.getLastMessageAt().toString() : null
            );

            // 1. Check Spam / Suspicious first
            if (List.of("suspicious", "spam", "gmail_spam").contains(category)) {
                if (assignedThreads.add(tid)) {
                    possibleSpamOrSuspicious.add(item);
                }
                continue;
            }

            // 2. Check Newsletters / Bulk
            if (List.of("newsletter", "promotional").contains(category)) {
                if (assignedThreads.add(tid)) {
                    newslettersBulk.add(item);
                }
                continue;
            }

            // 3. Needs You Today (high urgency, deadline today, or user owes urgent reply)
            if (dueToday || urgency >= 45 || ("user".equals(whoOwesNext) && (importance >= 60 || thread.isNeedsReply()))) {
                if (assignedThreads.add(tid)) {
                    needsYouToday.add(item);
                }
                continue;
            }

            // 4. Promises you made (open user commitment)
            boolean hasUserCommitment = threadCommitments.stream().anyMatch(c -> "user".equals(c.getActor()) && !"done".equals(c.getEffectiveStatus()));
            if (hasUserCommitment) {
                if (assignedThreads.add(tid)) {
                    promisesYouMade.add(item);
                }
                continue;
            }

            // 5. Waiting on someone else (other person owes next step or open other commitment)
            boolean hasOtherCommitment = threadCommitments.stream().anyMatch(c -> "other".equals(c.getActor()) && !"done".equals(c.getEffectiveStatus()));
            if ("other".equals(whoOwesNext) || hasOtherCommitment) {
                if (assignedThreads.add(tid)) {
                    waitingOnSomeoneElse.add(item);
                }
                continue;
            }

            // 6. Important, but not urgent
            if (importance >= 45 && urgency < 40) {
                if (assignedThreads.add(tid)) {
                    importantNotUrgent.add(item);
                }
            }
        }

        // Sort sections by priority
        needsYouToday.sort(Comparator.comparingInt(DailyBriefItemDto::urgencyScore).reversed());
        waitingOnSomeoneElse.sort(Comparator.comparingInt(DailyBriefItemDto::importanceScore).reversed());
        promisesYouMade.sort(Comparator.comparingInt(DailyBriefItemDto::importanceScore).reversed());
        importantNotUrgent.sort(Comparator.comparingInt(DailyBriefItemDto::importanceScore).reversed());

        boolean hasHighConfidence = !needsYouToday.isEmpty() || !promisesYouMade.isEmpty();
        String summaryMessage = hasHighConfidence
                ? "You have " + needsYouToday.size() + " item" + (needsYouToday.size() == 1 ? "" : "s") + " requiring attention today."
                : "No clear action due today. All business threads and follow-ups are up to date.";

        return new DailyBriefResponse(
                briefDateStr,
                Instant.now().toString(),
                profile.getProfileType(),
                summaryMessage,
                needsYouToday,
                waitingOnSomeoneElse,
                promisesYouMade,
                importantNotUrgent,
                newslettersBulk,
                possibleSpamOrSuspicious,
                hasHighConfidence
        );
    }

    private String determineWhoOwesNext(EmailThread thread, List<Email> messages, User user, List<EmailCommitment> commitments) {
        // If user made an open commitment, user owes next step
        for (EmailCommitment c : commitments) {
            if ("user".equals(c.getActor()) && "open".equals(c.getEffectiveStatus())) {
                return "user";
            }
        }

        // Check latest message sender
        if (messages != null && !messages.isEmpty()) {
            Email latest = messages.get(messages.size() - 1);
            boolean isUserSender = user.getEmail() != null && user.getEmail().equalsIgnoreCase(latest.getSenderEmail());
            if (isUserSender) {
                return "other"; // User sent last message, waiting on counterpart
            } else {
                return "user"; // Counterpart sent last message
            }
        }

        if (thread.isNeedsReply()) {
            return "user";
        }

        return "none";
    }

    private String suggestNextAction(String category, String whoOwesNext, boolean dueToday, List<EmailCommitment> commitments) {
        if ("suspicious".equals(category) || "spam".equals(category) || "gmail_spam".equals(category)) {
            return "Review suspicious sender before interacting";
        }
        if ("newsletter".equals(category) || "promotional".equals(category)) {
            return "Browse or archive at convenience";
        }
        if (dueToday) {
            return "Submit deliverable or respond before end of business day";
        }
        if ("user".equals(whoOwesNext)) {
            return "Review context and send reply";
        }
        if ("other".equals(whoOwesNext)) {
            return "Awaiting response from sender";
        }
        return "Review thread details";
    }
}

