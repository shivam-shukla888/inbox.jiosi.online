package com.jiosi.inbox.api;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.jiosi.inbox.email.EmailDraft;
import com.jiosi.inbox.email.EmailDraftRepository;
import com.jiosi.inbox.email.dto.SaveDraftRequest;
import com.jiosi.inbox.security.AuthTokenService;
import com.jiosi.inbox.user.User;
import com.jiosi.inbox.user.UserRepository;
import com.jiosi.inbox.workspace.Workspace;
import com.jiosi.inbox.workspace.WorkspaceMember;
import com.jiosi.inbox.workspace.WorkspaceMemberRepository;
import com.jiosi.inbox.workspace.WorkspaceRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

import static org.hamcrest.Matchers.hasSize;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class EmailDraftApiTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private EmailDraftRepository draftRepository;

    @Autowired
    private WorkspaceRepository workspaceRepository;

    @Autowired
    private WorkspaceMemberRepository workspaceMemberRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private AuthTokenService authTokenService;

    private Workspace workspace;
    private String authToken;

    @BeforeEach
    void setUp() {
        User user = userRepository.save(new User("author-" + UUID.randomUUID() + "@jiosi.online", "Alex Rivera", "AR"));
        workspace = workspaceRepository.save(new Workspace("Drafts Workspace", "drafts-ws-" + UUID.randomUUID(), user));
        workspaceMemberRepository.save(new WorkspaceMember(workspace, user, "OWNER"));
        authToken = "Bearer " + authTokenService.generateToken(user);
    }

    @Test
    void testSaveDraft_CreatesNewDraft() throws Exception {
        SaveDraftRequest req = new SaveDraftRequest(
                null,
                null,
                "partner@benchmark.com",
                "Peter Fenton",
                "Product Update",
                "Here are the metrics for this week."
        );

        mockMvc.perform(post("/api/v1/drafts")
                        .header("Authorization", authToken)
                        .header("X-Workspace-Id", workspace.getId().toString())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.toEmail").value("partner@benchmark.com"))
                .andExpect(jsonPath("$.data.subject").value("Product Update"));
    }

    @Test
    void testGetDrafts_ReturnsList() throws Exception {
        EmailDraft draft = new EmailDraft();
        draft.setWorkspace(workspace);
        draft.setToEmail("test@example.com");
        draft.setSubject("Draft 1");
        draft.setBody("Body 1");
        draftRepository.save(draft);

        mockMvc.perform(get("/api/v1/drafts")
                        .header("Authorization", authToken)
                        .header("X-Workspace-Id", workspace.getId().toString()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.content", hasSize(1)));
    }

    @Test
    void testDeleteDraft_RemovesDraft() throws Exception {
        EmailDraft draft = new EmailDraft();
        draft.setWorkspace(workspace);
        draft.setToEmail("test@example.com");
        draft.setSubject("Draft to delete");
        draft.setBody("Body");
        draft = draftRepository.save(draft);

        mockMvc.perform(delete("/api/v1/drafts/" + draft.getId())
                        .header("Authorization", authToken)
                        .header("X-Workspace-Id", workspace.getId().toString()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        assertFalse(draftRepository.findByWorkspaceIdAndId(workspace.getId(), draft.getId()).isPresent());
    }
}
