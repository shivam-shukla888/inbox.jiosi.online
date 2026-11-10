package com.jiosi.inbox.ai;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.jiosi.inbox.ai.dto.DailyBriefResponse;
import com.jiosi.inbox.ai.entity.DailyBriefCache;
import com.jiosi.inbox.ai.entity.EmailCommitment;
import com.jiosi.inbox.ai.entity.ThreadAiTriage;
import com.jiosi.inbox.ai.entity.UserBusinessProfile;
import com.jiosi.inbox.ai.repository.DailyBriefCacheRepository;
import com.jiosi.inbox.ai.repository.EmailCommitmentRepository;
import com.jiosi.inbox.ai.repository.ThreadAiTriageRepository;
import com.jiosi.inbox.ai.service.BusinessProfileService;
import com.jiosi.inbox.ai.service.DailyBriefService;
import com.jiosi.inbox.ai.service.ScoringEngine;
import com.jiosi.inbox.email.Email;
import com.jiosi.inbox.email.EmailRepository;
import com.jiosi.inbox.email.EmailThread;
import com.jiosi.inbox.email.EmailThreadRepository;
import com.jiosi.inbox.security.WorkspaceAuthorizationService;
import com.jiosi.inbox.user.User;
import com.jiosi.inbox.workspace.Workspace;
import com.jiosi.inbox.workspace.WorkspaceRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.*;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class DailyBriefServiceTests {

    @Mock
    private EmailThreadRepository threadRepository;

    @Mock
    private EmailRepository emailRepository;

    @Mock
    private ThreadAiTriageRepository triageRepository;

    @Mock
    private EmailCommitmentRepository commitmentRepository;

    @Mock
    private DailyBriefCacheRepository cacheRepository;

    @Mock
    private BusinessProfileService profileService;

    @Mock
    private WorkspaceAuthorizationService workspaceAuthService;

    @Mock
    private WorkspaceRepository workspaceRepository;

    private ScoringEngine scoringEngine;
    private ObjectMapper objectMapper;
    private DailyBriefService service;

    private User testUser;
    private Workspace testWorkspace;
    private UUID workspaceId;

    @BeforeEach
    void setUp() {
        scoringEngine = new ScoringEngine();
        objectMapper = new ObjectMapper();

        service = new DailyBriefService(
                threadRepository,
                emailRepository,
                triageRepository,
                commitmentRepository,
                cacheRepository,
                profileService,
                scoringEngine,
                workspaceAuthService,
                workspaceRepository,
                objectMapper
        );

        workspaceId = UUID.randomUUID();
        testUser = new User();
        testUser.setId(UUID.randomUUID());
        testUser.setEmail("founder@startup.com");

        testWorkspace = new Workspace();
        testWorkspace.setId(workspaceId);
    }

    @Test
    @DisplayName("computeDailyBrief categorizes threads correctly and strictly deduplicates them across sections")
    void testDailyBriefCategorizationAndDeduplication() {
        UserBusinessProfile profile = new UserBusinessProfile(testUser.getId(), testWorkspace, "small_saas");
        profile.setTimezone("UTC");
        when(profileService.getOrCreateProfile(testUser, workspaceId)).thenReturn(profile);
        when(cacheRepository.findByUserIdAndWorkspaceIdAndBriefDate(eq(testUser.getId()), eq(workspaceId), anyString()))
                .thenReturn(Optional.empty());
        when(workspaceRepository.findById(workspaceId)).thenReturn(Optional.of(testWorkspace));

        // 1. Thread: Urgent Outage (Needs you today)
        EmailThread urgentThread = createThread(UUID.randomUUID(), "P0 Outage: Payment gateway down", "ops@startup.com");
        ThreadAiTriage urgentTriage = new ThreadAiTriage(urgentThread, testWorkspace);
        urgentTriage.setCategory("primary");
        urgentTriage.setImportanceScore(90);
        urgentTriage.setUrgencyScore(85);
        urgentTriage.setNeedsReply(true);

        // 2. Thread: Waiting on Supplier response
        EmailThread waitingThread = createThread(UUID.randomUUID(), "Quote for server hardware", "sales@hardware.com");
        ThreadAiTriage waitingTriage = new ThreadAiTriage(waitingThread, testWorkspace);
        waitingTriage.setCategory("primary");
        waitingTriage.setImportanceScore(60);
        waitingTriage.setUrgencyScore(20);
        waitingTriage.setNeedsReply(false);

        // Email messages stubbing
        when(emailRepository.findByThreadIdOrderBySentAtAsc(any())).thenAnswer(inv -> {
            UUID id = inv.getArgument(0);
            if (id.equals(waitingThread.getId())) {
                Email sentEmail = new Email();
                sentEmail.setSenderEmail("founder@startup.com"); // User is sender!
                return List.of(sentEmail);
            }
            return List.of();
        });

        // 3. Thread: Newsletter
        EmailThread newsThread = createThread(UUID.randomUUID(), "Tech Weekly Roundup #42", "news@digest.com");
        ThreadAiTriage newsTriage = new ThreadAiTriage(newsThread, testWorkspace);
        newsTriage.setCategory("newsletter");
        newsTriage.setImportanceScore(20);
        newsTriage.setUrgencyScore(10);

        // 4. Thread: Phishing/Suspicious
        EmailThread spamThread = createThread(UUID.randomUUID(), "Account suspended: verify password", "attacker@phish.com");
        ThreadAiTriage spamTriage = new ThreadAiTriage(spamThread, testWorkspace);
        spamTriage.setCategory("suspicious");
        spamTriage.setImportanceScore(10);
        spamTriage.setUrgencyScore(10);

        when(threadRepository.findInboxAll(eq(workspaceId), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of(urgentThread, waitingThread, newsThread, spamThread)));

        when(triageRepository.findByThreadIdAndWorkspaceId(urgentThread.getId(), workspaceId)).thenReturn(Optional.of(urgentTriage));
        when(triageRepository.findByThreadIdAndWorkspaceId(waitingThread.getId(), workspaceId)).thenReturn(Optional.of(waitingTriage));
        when(triageRepository.findByThreadIdAndWorkspaceId(newsThread.getId(), workspaceId)).thenReturn(Optional.of(newsTriage));
        when(triageRepository.findByThreadIdAndWorkspaceId(spamThread.getId(), workspaceId)).thenReturn(Optional.of(spamTriage));

        when(commitmentRepository.findActiveCommitments(eq(workspaceId), anyList())).thenReturn(List.of());

        DailyBriefResponse brief = service.getDailyBrief(workspaceId, testUser, true);

        assertThat(brief).isNotNull();
        assertThat(brief.hasHighConfidenceItems()).isTrue();

        // Check Needs You Today
        assertThat(brief.needsYouToday()).hasSize(1);
        assertThat(brief.needsYouToday().get(0).threadId()).isEqualTo(urgentThread.getId());

        // Check Waiting on Someone Else
        assertThat(brief.waitingOnSomeoneElse()).hasSize(1);
        assertThat(brief.waitingOnSomeoneElse().get(0).threadId()).isEqualTo(waitingThread.getId());

        // Check Newsletters
        assertThat(brief.newslettersBulk()).hasSize(1);
        assertThat(brief.newslettersBulk().get(0).threadId()).isEqualTo(newsThread.getId());

        // Check Spam
        assertThat(brief.possibleSpamOrSuspicious()).hasSize(1);
        assertThat(brief.possibleSpamOrSuspicious().get(0).threadId()).isEqualTo(spamThread.getId());

        // STRICT DEDUPLICATION CHECK: No thread appears in multiple sections!
        Set<UUID> allSeenIds = new HashSet<>();
        for (var item : brief.needsYouToday()) assertThat(allSeenIds.add(item.threadId())).isTrue();
        for (var item : brief.waitingOnSomeoneElse()) assertThat(allSeenIds.add(item.threadId())).isTrue();
        for (var item : brief.promisesYouMade()) assertThat(allSeenIds.add(item.threadId())).isTrue();
        for (var item : brief.importantNotUrgent()) assertThat(allSeenIds.add(item.threadId())).isTrue();
        for (var item : brief.newslettersBulk()) assertThat(allSeenIds.add(item.threadId())).isTrue();
        for (var item : brief.possibleSpamOrSuspicious()) assertThat(allSeenIds.add(item.threadId())).isTrue();
    }

    @Test
    @DisplayName("Empty state reports honest clear message when no urgent items are due")
    void testDailyBriefEmptyState() {
        UserBusinessProfile profile = new UserBusinessProfile(testUser.getId(), testWorkspace, "generic");
        when(profileService.getOrCreateProfile(testUser, workspaceId)).thenReturn(profile);
        when(cacheRepository.findByUserIdAndWorkspaceIdAndBriefDate(eq(testUser.getId()), eq(workspaceId), anyString()))
                .thenReturn(Optional.empty());
        when(workspaceRepository.findById(workspaceId)).thenReturn(Optional.of(testWorkspace));
        when(threadRepository.findInboxAll(eq(workspaceId), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of()));
        when(commitmentRepository.findActiveCommitments(eq(workspaceId), anyList())).thenReturn(List.of());

        DailyBriefResponse brief = service.getDailyBrief(workspaceId, testUser, true);

        assertThat(brief.needsYouToday()).isEmpty();
        assertThat(brief.hasHighConfidenceItems()).isFalse();
        assertThat(brief.summaryMessage()).contains("No clear action due today");
    }

    private EmailThread createThread(UUID id, String subject, String senderEmail) {
        EmailThread t = new EmailThread();
        t.setId(id);
        t.setWorkspace(testWorkspace);
        t.setSubject(subject);
        t.setSenderName("Sender");
        t.setSenderEmail(senderEmail);
        t.setLastMessageAt(Instant.now());
        return t;
    }
}
