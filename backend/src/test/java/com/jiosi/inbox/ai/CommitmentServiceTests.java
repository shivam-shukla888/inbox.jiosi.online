package com.jiosi.inbox.ai;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.jiosi.inbox.ai.client.GroqClient;
import com.jiosi.inbox.ai.config.GroqProperties;
import com.jiosi.inbox.ai.dto.CommitmentStatusUpdateRequest;
import com.jiosi.inbox.ai.dto.EmailCommitmentDto;
import com.jiosi.inbox.ai.dto.GroqChatRequest;
import com.jiosi.inbox.ai.dto.GroqChatResponse;
import com.jiosi.inbox.ai.entity.EmailCommitment;
import com.jiosi.inbox.ai.repository.EmailCommitmentRepository;
import com.jiosi.inbox.ai.service.CommitmentService;
import com.jiosi.inbox.ai.service.EvidenceValidator;
import com.jiosi.inbox.ai.service.PromptInjectionGuard;
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

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CommitmentServiceTests {

    @Mock
    private GroqClient groqClient;

    @Mock
    private EmailCommitmentRepository commitmentRepository;

    @Mock
    private EmailThreadRepository threadRepository;

    @Mock
    private EmailRepository emailRepository;

    @Mock
    private WorkspaceAuthorizationService workspaceAuthService;

    @Mock
    private com.jiosi.inbox.ai.repository.UserAiPreferencesRepository preferencesRepository;

    private GroqProperties groqProperties;
    private PromptInjectionGuard promptGuard;
    private EvidenceValidator evidenceValidator;
    private ObjectMapper objectMapper;
    private CommitmentService service;

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
        objectMapper = new ObjectMapper();

        service = new CommitmentService(
                groqClient,
                groqProperties,
                promptGuard,
                evidenceValidator,
                commitmentRepository,
                threadRepository,
                emailRepository,
                workspaceAuthService,
                objectMapper,
                preferencesRepository
        );

        workspaceId = UUID.randomUUID();
        threadId = UUID.randomUUID();

        testUser = new User();
        testUser.setId(UUID.randomUUID());
        testUser.setEmail("alex@designco.com");
        testUser.setFullName("Alex Rivera");

        testWorkspace = new Workspace();
        testWorkspace.setId(workspaceId);

        testThread = new EmailThread();
        testThread.setId(threadId);
        testThread.setWorkspace(testWorkspace);
        testThread.setSubject("Logo design milestone agreement");
        testThread.setSenderName("Client Sarah");
        testThread.setSenderEmail("sarah@client.com");

        testEmail = new Email();
        testEmail.setId(UUID.randomUUID());
        testEmail.setThread(testThread);
        testEmail.setSenderName("Client Sarah");
        testEmail.setSenderEmail("sarah@client.com");
        testEmail.setBodyText("Hi Alex, please send the revised color palette by Friday 5 PM. We will review and approve the wireframes by Monday.");
    }

    @Test
    @DisplayName("extractAndSyncCommitments parses, validates quotes, and persists commitments")
    void testExtractAndSyncCommitments() {
        when(threadRepository.findByIdAndWorkspaceId(threadId, workspaceId)).thenReturn(Optional.of(testThread));
        when(emailRepository.findByThreadIdOrderBySentAtAsc(threadId)).thenReturn(List.of(testEmail));

        String mockGroqJson = """
                {
                  "commitments": [
                    {
                      "actor": "user",
                      "action": "Send revised color palette",
                      "target": "Client Sarah",
                      "dueDate": "2026-11-20T17:00:00Z",
                      "evidenceQuote": "please send the revised color palette by Friday 5 PM",
                      "status": "open",
                      "confidence": 0.95
                    },
                    {
                      "actor": "other",
                      "action": "Review and approve the wireframes",
                      "target": "Alex Rivera",
                      "dueDate": "2026-11-23T17:00:00Z",
                      "evidenceQuote": "We will review and approve the wireframes by Monday",
                      "status": "open",
                      "confidence": 0.90
                    },
                    {
                      "actor": "user",
                      "action": "Hallucinated payment of $50,000",
                      "target": "Unknown",
                      "evidenceQuote": "This sentence does not exist anywhere in the email body",
                      "status": "open",
                      "confidence": 0.40
                    }
                  ]
                }
                """;

        GroqChatResponse mockResponse = new GroqChatResponse(
                "chatcmpl-1",
                "llama-3.3-70b-versatile",
                List.of(new GroqChatResponse.Choice(0, new GroqChatResponse.Message("assistant", mockGroqJson), "stop")),
                new GroqChatResponse.Usage(50, 60, 110)
        );

        when(groqClient.chatCompletion(any(GroqChatRequest.class))).thenReturn(mockResponse);
        when(commitmentRepository.findByWorkspaceIdAndFingerprint(eq(workspaceId), anyString())).thenReturn(Optional.empty());
        when(commitmentRepository.save(any(EmailCommitment.class))).thenAnswer(inv -> inv.getArgument(0));

        List<EmailCommitmentDto> results = service.extractAndSyncCommitments(threadId, workspaceId, testUser);

        // Grounding check: The 3rd hallucinated item must be rejected because its evidenceQuote is not in the email!
        assertThat(results).hasSize(2);

        EmailCommitmentDto userPromise = results.stream().filter(c -> "user".equals(c.actor())).findFirst().orElseThrow();
        assertThat(userPromise.action()).isEqualTo("Send revised color palette");
        assertThat(userPromise.evidenceQuote()).isEqualTo("please send the revised color palette by Friday 5 PM");

        EmailCommitmentDto otherPromise = results.stream().filter(c -> "other".equals(c.actor())).findFirst().orElseThrow();
        assertThat(otherPromise.action()).isEqualTo("Review and approve the wireframes");
        assertThat(otherPromise.evidenceQuote()).isEqualTo("We will review and approve the wireframes by Monday");
    }

    @Test
    @DisplayName("updateCommitmentStatus updates status and records audit trail note")
    void testUpdateCommitmentStatus() {
        UUID commitmentId = UUID.randomUUID();
        EmailCommitment commitment = new EmailCommitment(testThread, testWorkspace, "user", "Send revised color palette", "user:send-palette");
        commitment.setId(commitmentId);

        when(commitmentRepository.findById(commitmentId)).thenReturn(Optional.of(commitment));
        when(commitmentRepository.save(any(EmailCommitment.class))).thenAnswer(inv -> inv.getArgument(0));

        CommitmentStatusUpdateRequest request = new CommitmentStatusUpdateRequest("done", "Client confirmed palette receipt");
        EmailCommitmentDto updated = service.updateCommitmentStatus(commitmentId, workspaceId, testUser, request);

        assertThat(updated.effectiveStatus()).isEqualTo("done");
        assertThat(updated.auditNote()).isEqualTo("Client confirmed palette receipt");
    }

    @Test
    @DisplayName("extractAndSyncCommitments throws AiConsentRequiredException and never calls Groq when consent is false")
    void testExtractCommitmentsBlockedWhenAiConsentRevoked() {
        com.jiosi.inbox.ai.entity.UserAiPreferences preferences = new com.jiosi.inbox.ai.entity.UserAiPreferences(
                testUser.getId(),
                false, // consent is OFF
                "professional",
                "match_thread"
        );
        when(preferencesRepository.findByUserId(testUser.getId())).thenReturn(Optional.of(preferences));

        org.assertj.core.api.Assertions.assertThatThrownBy(() ->
                service.extractAndSyncCommitments(threadId, workspaceId, testUser)
        ).isInstanceOf(com.jiosi.inbox.ai.service.EmailIntelligenceService.AiConsentRequiredException.class)
         .hasMessageContaining("AI processing consent is disabled in your privacy settings");

        // Verify Groq was NEVER called and no external network request occurred
        verify(groqClient, never()).chatCompletion(any());
        verify(threadRepository, never()).findByIdAndWorkspaceId(any(), any());
    }
}
