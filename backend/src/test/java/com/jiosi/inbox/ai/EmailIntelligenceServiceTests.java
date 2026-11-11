package com.jiosi.inbox.ai;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.jiosi.inbox.ai.client.GroqClient;
import com.jiosi.inbox.ai.config.GroqProperties;
import com.jiosi.inbox.ai.dto.*;
import com.jiosi.inbox.ai.entity.ThreadAiTriage;
import com.jiosi.inbox.ai.entity.UserAiPreferences;
import com.jiosi.inbox.ai.repository.ThreadAiTriageRepository;
import com.jiosi.inbox.ai.repository.UserAiPreferencesRepository;
import com.jiosi.inbox.ai.service.EmailIntelligenceService;
import com.jiosi.inbox.ai.service.EvidenceValidator;
import com.jiosi.inbox.ai.service.PromptInjectionGuard;
import com.jiosi.inbox.ai.service.ScoringEngine;
import com.jiosi.inbox.email.Email;
import com.jiosi.inbox.email.EmailRepository;
import com.jiosi.inbox.email.EmailThread;
import com.jiosi.inbox.email.EmailThreadRepository;
import com.jiosi.inbox.security.WorkspaceAuthorizationService;
import com.jiosi.inbox.user.User;
import com.jiosi.inbox.workspace.Workspace;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class EmailIntelligenceServiceTests {

    @Mock
    private GroqClient groqClient;
    @Mock
    private EmailThreadRepository threadRepository;
    @Mock
    private EmailRepository emailRepository;
    @Mock
    private ThreadAiTriageRepository triageRepository;
    @Mock
    private UserAiPreferencesRepository preferencesRepository;
    @Mock
    private WorkspaceAuthorizationService workspaceAuthService;

    private GroqProperties groqProperties;
    private PromptInjectionGuard promptGuard;
    private EvidenceValidator evidenceValidator;
    private ScoringEngine scoringEngine;
    private ObjectMapper objectMapper;
    private EmailIntelligenceService service;

    private User testUser;
    private Workspace testWorkspace;
    private EmailThread testThread;
    private Email testEmail;
    private UUID workspaceId;
    private UUID threadId;

    @BeforeEach
    void setUp() {
        groqProperties = new GroqProperties();
        groqProperties.setApiKey("gsk_mock_valid_key");
        groqProperties.setEnabled(true);

        promptGuard = new PromptInjectionGuard();
        evidenceValidator = new EvidenceValidator();
        scoringEngine = new ScoringEngine();
        objectMapper = new ObjectMapper();

        service = new EmailIntelligenceService(
                groqClient,
                groqProperties,
                promptGuard,
                evidenceValidator,
                scoringEngine,
                threadRepository,
                emailRepository,
                triageRepository,
                preferencesRepository,
                workspaceAuthService,
                objectMapper
        );

        testUser = new User("alex@jiosi.online", "Alex Rivera", null);
        testUser.setId(UUID.randomUUID());

        testWorkspace = new Workspace("Engineering", "eng-" + UUID.randomUUID(), testUser);
        workspaceId = UUID.randomUUID();
        testWorkspace.setId(workspaceId);

        threadId = UUID.randomUUID();
        testThread = new EmailThread();
        testThread.setId(threadId);
        testThread.setWorkspace(testWorkspace);
        testThread.setSubject("API Specification Review");
        testThread.setSnippet("Please review the OpenAPI 3.1 webhook schema by Thursday 2 PM.");
        testThread.setSenderName("Elena Rostova");
        testThread.setSenderEmail("elena@partner.com");
        testThread.setRecipientEmail("alex@jiosi.online");

        testEmail = new Email();
        testEmail.setId(UUID.randomUUID());
        testEmail.setThread(testThread);
        testEmail.setWorkspace(testWorkspace);
        testEmail.setSenderName("Elena Rostova");
        testEmail.setSenderEmail("elena@partner.com");
        testEmail.setRecipientEmail("alex@jiosi.online");
        testEmail.setSubject(testThread.getSubject());
        testEmail.setBodyText("Hi Alex,\nPlease review the OpenAPI 3.1 webhook schema by Thursday 2 PM so we can start integration tests.");
        testEmail.setSentAt(Instant.now());
    }

    @Test
    @DisplayName("summarizeThread generates and returns structured summary")
    void testSummarizeThread() {
        when(preferencesRepository.findByUserId(testUser.getId())).thenReturn(Optional.of(new UserAiPreferences(testUser.getId(), true, "professional", "match_thread")));
        when(threadRepository.findByIdAndWorkspaceId(threadId, workspaceId)).thenReturn(Optional.of(testThread));
        when(emailRepository.findByThreadIdOrderBySentAtAsc(threadId)).thenReturn(List.of(testEmail));

        String mockJson = """
                {
                  "gist": "Elena requested review of the OpenAPI 3.1 webhook schema by Thursday 2 PM.",
                  "keyDecisions": ["OpenAPI 3.1 specification drafted for webhooks"],
                  "openQuestion": "Can the review be completed by Thursday 2 PM?",
                  "explicitDeadline": "Thursday 2:00 PM",
                  "suggestedNextAction": "Review webhook schema and confirm alignment."
                }
                """;

        GroqChatResponse mockResponse = new GroqChatResponse("id-1", "llama-3.3-70b-versatile",
                List.of(new GroqChatResponse.Choice(0, new GroqChatResponse.Message("assistant", mockJson), "stop")), null);
        when(groqClient.chatCompletion(any())).thenReturn(mockResponse);

        ThreadSummaryResponse summary = service.summarizeThread(threadId, workspaceId, testUser);

        assertThat(summary).isNotNull();
        assertThat(summary.gist()).contains("OpenAPI 3.1");
        assertThat(summary.keyDecisions()).contains("OpenAPI 3.1 specification drafted for webhooks");
        assertThat(summary.explicitDeadline()).isEqualTo("Thursday 2:00 PM");
        verify(threadRepository).save(testThread);
    }

    @Test
    @DisplayName("extractActionItems verifies evidence quotes and filters hallucinated ones")
    void testExtractActionItemsWithEvidenceVerification() {
        when(preferencesRepository.findByUserId(testUser.getId())).thenReturn(Optional.of(new UserAiPreferences(testUser.getId(), true, "professional", "match_thread")));
        when(threadRepository.findByIdAndWorkspaceId(threadId, workspaceId)).thenReturn(Optional.of(testThread));
        when(emailRepository.findByThreadIdOrderBySentAtAsc(threadId)).thenReturn(List.of(testEmail));

        String mockJson = """
                {
                  "items": [
                    {
                      "title": "Review OpenAPI 3.1 webhook schema",
                      "owner": "Alex",
                      "dueDate": "Thursday 2:00 PM",
                      "evidenceQuote": "Please review the OpenAPI 3.1 webhook schema by Thursday 2 PM",
                      "confidence": 0.95
                    },
                    {
                      "title": "Wire $50,000 security deposit",
                      "owner": "Alex",
                      "dueDate": "Friday",
                      "evidenceQuote": "Alex agreed to wire $50,000 immediately",
                      "confidence": 0.80
                    }
                  ]
                }
                """;

        GroqChatResponse mockResponse = new GroqChatResponse("id-2", "llama-3.3-70b-versatile",
                List.of(new GroqChatResponse.Choice(0, new GroqChatResponse.Message("assistant", mockJson), "stop")), null);
        when(groqClient.chatCompletion(any())).thenReturn(mockResponse);

        List<ActionItemDto> items = service.extractActionItems(threadId, workspaceId, testUser);

        assertThat(items).hasSize(1);
        assertThat(items.get(0).title()).isEqualTo("Review OpenAPI 3.1 webhook schema");
        assertThat(items.get(0).evidenceQuote()).contains("OpenAPI 3.1 webhook schema");
    }

    @Test
    @DisplayName("generateReplyDraft respects requested tone and language")
    void testGenerateReplyDraft() {
        when(preferencesRepository.findByUserId(testUser.getId())).thenReturn(Optional.of(new UserAiPreferences(testUser.getId(), true, "professional", "match_thread")));
        when(threadRepository.findByIdAndWorkspaceId(threadId, workspaceId)).thenReturn(Optional.of(testThread));
        when(emailRepository.findByThreadIdOrderBySentAtAsc(threadId)).thenReturn(List.of(testEmail));

        String mockDraft = "Hi Elena,\n\nThank you for the update. We have begun reviewing the OpenAPI 3.1 schema and will share feedback by Thursday 2 PM.\n\nBest regards,\nAlex";

        GroqChatResponse mockResponse = new GroqChatResponse("id-3", "llama-3.1-8b-instant",
                List.of(new GroqChatResponse.Choice(0, new GroqChatResponse.Message("assistant", mockDraft), "stop")), null);
        when(groqClient.chatCompletion(any())).thenReturn(mockResponse);

        ReplyDraftRequest request = new ReplyDraftRequest("professional", "en", null);
        ReplyDraftResponse response = service.generateReplyDraft(threadId, workspaceId, testUser, request);

        assertThat(response.draftText()).isEqualTo(mockDraft);
        assertThat(response.tone()).isEqualTo("professional");
        assertThat(response.language()).isEqualTo("en");
    }

    @Test
    @DisplayName("assistCompose rewrites text and returns reviewable comparison")
    void testAssistCompose() {
        when(preferencesRepository.findByUserId(testUser.getId())).thenReturn(Optional.of(new UserAiPreferences(testUser.getId(), true, "professional", "match_thread")));

        String mockJson = """
                {
                  "suggestedText": "Dear Elena,\\n\\nI have reviewed the webhook documentation and confirm our team can proceed with testing.",
                  "explanation": "Enhanced professionalism and polished phrasing."
                }
                """;

        GroqChatResponse mockResponse = new GroqChatResponse("id-4", "llama-3.1-8b-instant",
                List.of(new GroqChatResponse.Choice(0, new GroqChatResponse.Message("assistant", mockJson), "stop")), null);
        when(groqClient.chatCompletion(any())).thenReturn(mockResponse);

        ComposeAssistRequest request = new ComposeAssistRequest("Hey Elena, looks ok to test", "tone_professional", "en", null);
        ComposeAssistResponse response = service.assistCompose(request, testUser);

        assertThat(response.originalText()).isEqualTo("Hey Elena, looks ok to test");
        assertThat(response.suggestedText()).contains("Dear Elena");
        assertThat(response.action()).isEqualTo("tone_professional");
    }

    @Test
    @DisplayName("triageThread classifies thread, calculates scores and persists ThreadAiTriage")
    void testTriageThread() {
        when(preferencesRepository.findByUserId(testUser.getId())).thenReturn(Optional.of(new UserAiPreferences(testUser.getId(), true, "professional", "match_thread")));
        when(threadRepository.findByIdAndWorkspaceId(threadId, workspaceId)).thenReturn(Optional.of(testThread));
        when(emailRepository.findByThreadIdOrderBySentAtAsc(threadId)).thenReturn(List.of(testEmail));
        when(triageRepository.findByThreadIdAndWorkspaceId(threadId, workspaceId)).thenReturn(Optional.empty());

        String mockJson = """
                {
                  "categorySuggestion": "primary",
                  "explicitDeadline": "2026-11-12T14:00:00Z",
                  "evidence": ["Please review the OpenAPI 3.1 webhook schema by Thursday 2 PM"],
                  "confidence": 0.92
                }
                """;

        GroqChatResponse mockResponse = new GroqChatResponse("id-5", "llama-3.3-70b-versatile",
                List.of(new GroqChatResponse.Choice(0, new GroqChatResponse.Message("assistant", mockJson), "stop")), null);
        when(groqClient.chatCompletion(any())).thenReturn(mockResponse);

        TriageClassificationResponse triage = service.triageThread(threadId, workspaceId, testUser);

        assertThat(triage).isNotNull();
        assertThat(triage.category()).isEqualTo("primary");
        assertThat(triage.importanceScore()).isGreaterThan(0);
        assertThat(triage.evidence()).contains("Please review the OpenAPI 3.1 webhook schema by Thursday 2 PM");
        verify(triageRepository).save(any(ThreadAiTriage.class));
    }

    @Test
    @DisplayName("When AI consent is disabled, throws AiConsentRequiredException and never calls Groq")
    void testConsentDisabledThrowsException() {
        UserAiPreferences optOut = new UserAiPreferences(testUser.getId(), false, "professional", "match_thread");
        when(preferencesRepository.findByUserId(testUser.getId())).thenReturn(Optional.of(optOut));

        assertThatThrownBy(() -> service.summarizeThread(threadId, workspaceId, testUser))
                .isInstanceOf(EmailIntelligenceService.AiConsentRequiredException.class)
                .hasMessageContaining("AI processing is disabled in your privacy settings");

        verifyNoInteractions(groqClient);
    }

    @Test
    @DisplayName("When AI preferences record is missing, defaults to false, throws AiConsentRequiredException, zero Groq calls")
    void testMissingPreferencesDefaultsToConsentFalse() {
        when(preferencesRepository.findByUserId(testUser.getId())).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.summarizeThread(threadId, workspaceId, testUser))
                .isInstanceOf(EmailIntelligenceService.AiConsentRequiredException.class)
                .hasMessageContaining("AI processing is disabled in your privacy settings");

        verifyNoInteractions(groqClient);
    }

    @Test
    @DisplayName("When preferencesRepository is null, fails closed and never calls Groq")
    void testNullPreferencesRepositoryFailsClosed() {
        EmailIntelligenceService serviceWithNullRepo = new EmailIntelligenceService(
                groqClient,
                groqProperties,
                promptGuard,
                evidenceValidator,
                scoringEngine,
                threadRepository,
                emailRepository,
                triageRepository,
                null,
                workspaceAuthService,
                objectMapper
        );

        assertThatThrownBy(() -> serviceWithNullRepo.summarizeThread(threadId, workspaceId, testUser))
                .isInstanceOf(EmailIntelligenceService.AiConsentRequiredException.class)
                .hasMessageContaining("AI processing is disabled in your privacy settings");

        verifyNoInteractions(groqClient);
    }

    @Test
    @DisplayName("When preferencesRepository throws exception, fails closed and never calls Groq")
    void testRepositoryExceptionFailsClosed() {
        when(preferencesRepository.findByUserId(testUser.getId())).thenThrow(new RuntimeException("Database timeout"));

        assertThatThrownBy(() -> service.summarizeThread(threadId, workspaceId, testUser))
                .isInstanceOf(EmailIntelligenceService.AiConsentRequiredException.class)
                .hasMessageContaining("AI processing is disabled in your privacy settings");

        verifyNoInteractions(groqClient);
    }

    @Test
    @DisplayName("All AI flows (action-items, reply draft, compose assist, triage) are blocked when consent is false")
    void testAllAiFlowsBlockedWhenConsentDisabled() {
        UserAiPreferences optOut = new UserAiPreferences(testUser.getId(), false, "professional", "match_thread");
        when(preferencesRepository.findByUserId(testUser.getId())).thenReturn(Optional.of(optOut));

        assertThatThrownBy(() -> service.extractActionItems(threadId, workspaceId, testUser))
                .isInstanceOf(EmailIntelligenceService.AiConsentRequiredException.class);

        assertThatThrownBy(() -> service.generateReplyDraft(threadId, workspaceId, testUser, new ReplyDraftRequest("professional", "match_thread", null)))
                .isInstanceOf(EmailIntelligenceService.AiConsentRequiredException.class);

        assertThatThrownBy(() -> service.assistCompose(new ComposeAssistRequest("Test body", "shorten", "en", null), testUser))
                .isInstanceOf(EmailIntelligenceService.AiConsentRequiredException.class);

        assertThatThrownBy(() -> service.triageThread(threadId, workspaceId, testUser))
                .isInstanceOf(EmailIntelligenceService.AiConsentRequiredException.class);

        verifyNoInteractions(groqClient);
    }

    @Test
    @DisplayName("Revoking consent blocks subsequent AI calls immediately")
    void testConsentRevocationLifecycle() {
        // Step 1: User has consent = true -> request succeeds
        when(preferencesRepository.findByUserId(testUser.getId()))
                .thenReturn(Optional.of(new UserAiPreferences(testUser.getId(), true, "professional", "match_thread")));
        when(threadRepository.findByIdAndWorkspaceId(threadId, workspaceId)).thenReturn(Optional.of(testThread));
        when(emailRepository.findByThreadIdOrderBySentAtAsc(threadId)).thenReturn(List.of(testEmail));

        String mockJson = """
                {
                  "gist": "Test summary",
                  "keyDecisions": [],
                  "openQuestion": null,
                  "explicitDeadline": null,
                  "suggestedNextAction": "Reply"
                }
                """;
        when(groqClient.chatCompletion(any())).thenReturn(
                new GroqChatResponse("id-1", "llama-3.3-70b-versatile",
                        List.of(new GroqChatResponse.Choice(0, new GroqChatResponse.Message("assistant", mockJson), "stop")), null)
        );

        ThreadSummaryResponse firstSummary = service.summarizeThread(threadId, workspaceId, testUser);
        assertThat(firstSummary).isNotNull();
        verify(groqClient, times(1)).chatCompletion(any());

        // Step 2: User revokes consent -> consent is now false
        when(preferencesRepository.findByUserId(testUser.getId()))
                .thenReturn(Optional.of(new UserAiPreferences(testUser.getId(), false, "professional", "match_thread")));

        assertThatThrownBy(() -> service.summarizeThread(threadId, workspaceId, testUser))
                .isInstanceOf(EmailIntelligenceService.AiConsentRequiredException.class);

        // Verify Groq was NOT called again (still exactly 1 total call)
        verify(groqClient, times(1)).chatCompletion(any());
    }

    @Test
    @DisplayName("getPreferences returns aiProcessingConsent = false for brand new users")
    void testGetPreferencesDefaultsToFalseForNewUser() {
        when(preferencesRepository.findByUserId(testUser.getId())).thenReturn(Optional.empty());

        UserAiPreferencesDto prefs = service.getPreferences(testUser);

        assertThat(prefs).isNotNull();
        assertThat(prefs.aiProcessingConsent()).isFalse();
        assertThat(prefs.defaultReplyTone()).isEqualTo("professional");
        assertThat(prefs.defaultReplyLanguage()).isEqualTo("match_thread");
    }
}
