package com.jiosi.inbox.api;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.jiosi.inbox.ai.client.GroqClient;
import com.jiosi.inbox.ai.dto.ComposeAssistRequest;
import com.jiosi.inbox.ai.dto.GroqChatResponse;
import com.jiosi.inbox.ai.dto.ReplyDraftRequest;
import com.jiosi.inbox.ai.dto.UserAiPreferencesDto;
import com.jiosi.inbox.email.Email;
import com.jiosi.inbox.email.EmailRepository;
import com.jiosi.inbox.email.EmailThread;
import com.jiosi.inbox.email.EmailThreadRepository;
import com.jiosi.inbox.security.AuthTokenService;
import com.jiosi.inbox.user.User;
import com.jiosi.inbox.user.UserRepository;
import com.jiosi.inbox.workspace.Workspace;
import com.jiosi.inbox.workspace.WorkspaceMember;
import com.jiosi.inbox.workspace.WorkspaceMemberRepository;
import com.jiosi.inbox.workspace.WorkspaceRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class EmailIntelligenceApiTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private GroqClient groqClient;

    @Autowired
    private WorkspaceRepository workspaceRepository;

    @Autowired
    private WorkspaceMemberRepository workspaceMemberRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private EmailThreadRepository threadRepository;

    @Autowired
    private EmailRepository emailRepository;

    @Autowired
    private AuthTokenService authTokenService;

    private User user;
    private Workspace workspace;
    private EmailThread thread;
    private String authToken;

    @BeforeEach
    void setUp() {
        user = userRepository.save(new User("alex-" + UUID.randomUUID() + "@jiosi.online", "Alex Rivera", "AR"));
        workspace = workspaceRepository.save(new Workspace("Engineering WS", "eng-ws-" + UUID.randomUUID(), user));
        workspaceMemberRepository.save(new WorkspaceMember(workspace, user, "OWNER"));
        authToken = "Bearer " + authTokenService.generateToken(user);

        thread = new EmailThread();
        thread.setWorkspace(workspace);
        thread.setSubject("Q4 Infrastructure Planning");
        thread.setSnippet("Review cluster capacity metrics by Friday.");
        thread.setSenderName("Elena Rostova");
        thread.setSenderEmail("elena@partner.com");
        thread.setRecipientEmail(user.getEmail());
        thread = threadRepository.save(thread);

        Email email = new Email();
        email.setWorkspace(workspace);
        email.setThread(thread);
        email.setSenderName("Elena Rostova");
        email.setSenderEmail("elena@partner.com");
        email.setRecipientEmail(user.getEmail());
        email.setSubject(thread.getSubject());
        email.setSnippet(thread.getSnippet());
        email.setBodyText("Hi Alex, please review cluster capacity metrics by Friday afternoon.");
        email.setSentAt(Instant.now());
        emailRepository.save(email);
    }

    @Test
    @DisplayName("Unauthenticated request returns 401")
    void testUnauthenticatedReturns401() throws Exception {
        mockMvc.perform(post("/api/v1/ai/threads/" + thread.getId() + "/summary")
                        .with(csrf())
                        .header("X-Workspace-Id", workspace.getId().toString())
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("Cross-workspace thread access returns 403 Forbidden")
    void testCrossWorkspaceAccessReturns403() throws Exception {
        User otherUser = userRepository.save(new User("other-" + UUID.randomUUID() + "@jiosi.online", "Other User", "OU"));
        Workspace otherWorkspace = workspaceRepository.save(new Workspace("Other WS", "other-ws-" + UUID.randomUUID(), otherUser));
        workspaceMemberRepository.save(new WorkspaceMember(otherWorkspace, otherUser, "OWNER"));
        String otherToken = "Bearer " + authTokenService.generateToken(otherUser);

        mockMvc.perform(post("/api/v1/ai/threads/" + thread.getId() + "/summary")
                        .header("Authorization", otherToken)
                        .header("X-Workspace-Id", workspace.getId().toString())
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("POST /api/v1/ai/threads/{threadId}/summary succeeds")
    void testThreadSummaryEndpoint() throws Exception {
        String mockJson = """
                {
                  "gist": "Elena requested review of cluster capacity metrics by Friday afternoon.",
                  "keyDecisions": ["Infrastructure capacity review required"],
                  "openQuestion": null,
                  "explicitDeadline": "Friday afternoon",
                  "suggestedNextAction": "Inspect cluster metrics."
                }
                """;

        when(groqClient.chatCompletion(any())).thenReturn(
                new GroqChatResponse("id-sum", "llama-3.3-70b-versatile",
                        List.of(new GroqChatResponse.Choice(0, new GroqChatResponse.Message("assistant", mockJson), "stop")), null)
        );

        mockMvc.perform(post("/api/v1/ai/threads/" + thread.getId() + "/summary")
                        .header("Authorization", authToken)
                        .header("X-Workspace-Id", workspace.getId().toString())
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.gist").value("Elena requested review of cluster capacity metrics by Friday afternoon."))
                .andExpect(jsonPath("$.data.explicitDeadline").value("Friday afternoon"));
    }

    @Test
    @DisplayName("POST /api/v1/ai/threads/{threadId}/action-items succeeds")
    void testExtractActionItemsEndpoint() throws Exception {
        String mockJson = """
                {
                  "items": [
                    {
                      "title": "Review cluster capacity metrics",
                      "owner": "Alex",
                      "dueDate": "Friday",
                      "evidenceQuote": "please review cluster capacity metrics by Friday afternoon",
                      "confidence": 0.95
                    }
                  ]
                }
                """;

        when(groqClient.chatCompletion(any())).thenReturn(
                new GroqChatResponse("id-act", "llama-3.3-70b-versatile",
                        List.of(new GroqChatResponse.Choice(0, new GroqChatResponse.Message("assistant", mockJson), "stop")), null)
        );

        mockMvc.perform(post("/api/v1/ai/threads/" + thread.getId() + "/action-items")
                        .header("Authorization", authToken)
                        .header("X-Workspace-Id", workspace.getId().toString())
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data[0].title").value("Review cluster capacity metrics"))
                .andExpect(jsonPath("$.data[0].dueDate").value("Friday"));
    }

    @Test
    @DisplayName("POST /api/v1/ai/threads/{threadId}/reply-draft succeeds")
    void testReplyDraftEndpoint() throws Exception {
        String mockDraft = "Hi Elena,\n\nI will review the cluster capacity metrics and send notes by Friday.\n\nBest,\nAlex";

        when(groqClient.chatCompletion(any())).thenReturn(
                new GroqChatResponse("id-drf", "llama-3.1-8b-instant",
                        List.of(new GroqChatResponse.Choice(0, new GroqChatResponse.Message("assistant", mockDraft), "stop")), null)
        );

        ReplyDraftRequest request = new ReplyDraftRequest("professional", "en", "Confirm review by Friday");

        mockMvc.perform(post("/api/v1/ai/threads/" + thread.getId() + "/reply-draft")
                        .header("Authorization", authToken)
                        .header("X-Workspace-Id", workspace.getId().toString())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.draftText").value(mockDraft))
                .andExpect(jsonPath("$.data.tone").value("professional"));
    }

    @Test
    @DisplayName("POST /api/v1/ai/threads/{threadId}/triage succeeds")
    void testTriageEndpoint() throws Exception {
        String mockJson = """
                {
                  "categorySuggestion": "primary",
                  "explicitDeadline": null,
                  "evidence": ["please review cluster capacity metrics by Friday afternoon"],
                  "confidence": 0.90
                }
                """;

        when(groqClient.chatCompletion(any())).thenReturn(
                new GroqChatResponse("id-trg", "llama-3.3-70b-versatile",
                        List.of(new GroqChatResponse.Choice(0, new GroqChatResponse.Message("assistant", mockJson), "stop")), null)
        );

        mockMvc.perform(post("/api/v1/ai/threads/" + thread.getId() + "/triage")
                        .header("Authorization", authToken)
                        .header("X-Workspace-Id", workspace.getId().toString())
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.category").value("primary"))
                .andExpect(jsonPath("$.data.importanceScore").isNumber())
                .andExpect(jsonPath("$.data.urgencyScore").isNumber());
    }

    @Test
    @DisplayName("POST /api/v1/ai/compose/assist succeeds")
    void testComposeAssistEndpoint() throws Exception {
        String mockJson = """
                {
                  "suggestedText": "Dear Elena,\\n\\nI have completed the review.",
                  "explanation": "Refined for professional tone."
                }
                """;

        when(groqClient.chatCompletion(any())).thenReturn(
                new GroqChatResponse("id-cmp", "llama-3.1-8b-instant",
                        List.of(new GroqChatResponse.Choice(0, new GroqChatResponse.Message("assistant", mockJson), "stop")), null)
        );

        ComposeAssistRequest request = new ComposeAssistRequest("Hey Elena, review done", "tone_professional", "en", null);

        mockMvc.perform(post("/api/v1/ai/compose/assist")
                        .header("Authorization", authToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.suggestedText").value("Dear Elena,\n\nI have completed the review."));
    }

    @Test
    @DisplayName("GET & PUT /api/v1/ai/preferences manages consent and tone preferences")
    void testPreferencesEndpoints() throws Exception {
        mockMvc.perform(get("/api/v1/ai/preferences")
                        .header("Authorization", authToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.aiProcessingConsent").value(true));

        UserAiPreferencesDto updateReq = new UserAiPreferencesDto(false, "friendly", "hi", true);

        mockMvc.perform(put("/api/v1/ai/preferences")
                        .header("Authorization", authToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.aiProcessingConsent").value(false))
                .andExpect(jsonPath("$.data.defaultReplyTone").value("friendly"))
                .andExpect(jsonPath("$.data.defaultReplyLanguage").value("hi"));
    }

    @Test
    @DisplayName("GET & PUT /api/v1/ai/profile manages small business workflow profiles")
    void testBusinessProfileEndpoints() throws Exception {
        // GET initial profile (defaults to generic)
        mockMvc.perform(get("/api/v1/ai/profile")
                        .header("Authorization", authToken)
                        .header("X-Workspace-Id", workspace.getId().toString()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.profileType").value("generic"))
                .andExpect(jsonPath("$.data.timezone").value("UTC"));

        // PUT update to freelancer_agency with VIP contacts
        var updateReq = new com.jiosi.inbox.ai.dto.UserBusinessProfileDto(
                "freelancer_agency",
                "Studio Acme",
                "Asia/Kolkata",
                "10:00",
                "19:00",
                true,
                "21:00",
                "09:00",
                List.of("client@acme.com", "@keypartner.com"),
                List.of("vendor@supplier.com"),
                "08:30",
                "en"
        );

        mockMvc.perform(put("/api/v1/ai/profile")
                        .header("Authorization", authToken)
                        .header("X-Workspace-Id", workspace.getId().toString())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.profileType").value("freelancer_agency"))
                .andExpect(jsonPath("$.data.businessName").value("Studio Acme"))
                .andExpect(jsonPath("$.data.timezone").value("Asia/Kolkata"))
                .andExpect(jsonPath("$.data.vipContacts[0]").value("client@acme.com"));
    }

    @Test
    @DisplayName("GET /api/v1/ai/daily-brief returns structured daily business brief")
    void testDailyBriefEndpoint() throws Exception {
        mockMvc.perform(get("/api/v1/ai/daily-brief")
                        .header("Authorization", authToken)
                        .header("X-Workspace-Id", workspace.getId().toString()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.briefDate").isString())
                .andExpect(jsonPath("$.data.summaryMessage").isString())
                .andExpect(jsonPath("$.data.needsYouToday").isArray())
                .andExpect(jsonPath("$.data.waitingOnSomeoneElse").isArray())
                .andExpect(jsonPath("$.data.promisesYouMade").isArray());
    }

    @Test
    @DisplayName("GET /api/v1/ai/commitments returns workspace action obligations")
    void testCommitmentsEndpoint() throws Exception {
        mockMvc.perform(get("/api/v1/ai/commitments")
                        .header("Authorization", authToken)
                        .header("X-Workspace-Id", workspace.getId().toString()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data").isArray());
    }

    @Test
    @DisplayName("GET /api/v1/threads/by-external/{externalThreadId} allows Chrome Extension thread lookup")
    void testLookupByExternalThreadId() throws Exception {
        thread.setExternalThreadId("18c54ff99812a");
        threadRepository.save(thread);

        mockMvc.perform(get("/api/v1/threads/by-external/18c54ff99812a")
                        .header("Authorization", authToken)
                        .header("X-Workspace-Id", workspace.getId().toString()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.id").value(thread.getId().toString()))
                .andExpect(jsonPath("$.data.subject").value(thread.getSubject()));
    }
}

