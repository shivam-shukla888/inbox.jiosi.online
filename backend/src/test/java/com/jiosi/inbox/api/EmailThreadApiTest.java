package com.jiosi.inbox.api;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.jiosi.inbox.email.*;
import com.jiosi.inbox.email.dto.*;
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

import java.util.List;
import java.util.Set;
import java.util.UUID;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class EmailThreadApiTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private EmailThreadRepository threadRepository;

    @Autowired
    private EmailRepository emailRepository;

    @Autowired
    private WorkspaceRepository workspaceRepository;

    @Autowired
    private WorkspaceMemberRepository workspaceMemberRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private AuthTokenService authTokenService;

    private Workspace workspace;
    private EmailThread thread;
    private String authToken;

    @BeforeEach
    void setUp() {
        User user = userRepository.save(new User("founder-" + UUID.randomUUID() + "@jiosi.online", "Alex Rivera", "AR"));
        workspace = workspaceRepository.save(new Workspace("JIOSI Primary", "jiosi-primary-" + UUID.randomUUID(), user));
        workspaceMemberRepository.save(new WorkspaceMember(workspace, user, "OWNER"));
        authToken = "Bearer " + authTokenService.generateToken(user);

        thread = new EmailThread();
        thread.setWorkspace(workspace);
        thread.setSubject("Q3 Seed Extension Term Sheet & Cap Table updates");
        thread.setSnippet("Alex, attached is the revised terms...");
        thread.setSenderName("Sarah Jenkins");
        thread.setSenderEmail("sarah@kinto.ventures");
        thread.setRecipientName("Alex Rivera");
        thread.setRecipientEmail("alex@jiosi.online");
        thread.setUnread(true);
        thread.setStarred(true);
        thread.setNeedsReply(true);
        thread.setTags(new java.util.HashSet<>(Set.of("Fundraising", "VIP")));
        thread = threadRepository.save(thread);

        Email msg = new Email();
        msg.setWorkspace(workspace);
        msg.setThread(thread);
        msg.setSenderName("Sarah Jenkins");
        msg.setSenderEmail("sarah@kinto.ventures");
        msg.setRecipientName("Alex Rivera");
        msg.setRecipientEmail("alex@jiosi.online");
        msg.setSubject(thread.getSubject());
        msg.setSnippet(thread.getSnippet());
        msg.setBodyText("Hi Alex, revised term sheet clean copy is attached.");
        emailRepository.save(msg);
    }

    @Test
    void testGetThreads_MissingWorkspaceHeader_ReturnsBadRequest() throws Exception {
        mockMvc.perform(get("/api/v1/threads")
                        .header("Authorization", authToken))
                .andExpect(status().isBadRequest());
    }

    @Test
    void testGetThreads_ValidWorkspace_ReturnsThreadListAndCounts() throws Exception {
        mockMvc.perform(get("/api/v1/threads")
                        .header("Authorization", authToken)
                        .header("X-Workspace-Id", workspace.getId().toString())
                        .param("folder", "inbox"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.threads", hasSize(1)))
                .andExpect(jsonPath("$.data.threads[0].subject").value("Q3 Seed Extension Term Sheet & Cap Table updates"))
                .andExpect(jsonPath("$.data.threads[0].isUnread").value(true))
                .andExpect(jsonPath("$.data.threads[0].isNeedsReply").value(true))
                .andExpect(jsonPath("$.data.folderCounts.inbox.total").value(1))
                .andExpect(jsonPath("$.data.folderCounts.inbox.unread").value(1));
    }

    @Test
    void testGetThreadDetail_ReturnsThreadAndMessages() throws Exception {
        mockMvc.perform(get("/api/v1/threads/" + thread.getId())
                        .header("Authorization", authToken)
                        .header("X-Workspace-Id", workspace.getId().toString()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.id").value(thread.getId().toString()))
                .andExpect(jsonPath("$.data.messages", hasSize(1)))
                .andExpect(jsonPath("$.data.messages[0].bodyText").value("Hi Alex, revised term sheet clean copy is attached."));
    }

    @Test
    void testSearchThreads_ReturnsMatchingResults() throws Exception {
        mockMvc.perform(get("/api/v1/threads/search")
                        .header("Authorization", authToken)
                        .header("X-Workspace-Id", workspace.getId().toString())
                        .param("q", "Term Sheet"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.threads", hasSize(1)));
    }

    @Test
    void testUpdateReadStatus_TogglesUnread() throws Exception {
        UpdateReadRequest req = new UpdateReadRequest(false);

        mockMvc.perform(patch("/api/v1/threads/" + thread.getId() + "/read")
                        .header("Authorization", authToken)
                        .header("X-Workspace-Id", workspace.getId().toString())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.isUnread").value(false));
    }

    @Test
    void testUpdateStarStatus_TogglesStar() throws Exception {
        UpdateStarRequest req = new UpdateStarRequest(false);

        mockMvc.perform(patch("/api/v1/threads/" + thread.getId() + "/star")
                        .header("Authorization", authToken)
                        .header("X-Workspace-Id", workspace.getId().toString())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.isStarred").value(false));
    }

    @Test
    void testUpdateArchiveStatus_TogglesArchive() throws Exception {
        UpdateArchiveRequest req = new UpdateArchiveRequest(true);

        mockMvc.perform(patch("/api/v1/threads/" + thread.getId() + "/archive")
                        .header("Authorization", authToken)
                        .header("X-Workspace-Id", workspace.getId().toString())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.isArchived").value(true));
    }

    @Test
    void testBatchRead_UpdatesMultipleThreads() throws Exception {
        BatchReadRequest req = new BatchReadRequest(List.of(thread.getId()), false);

        mockMvc.perform(post("/api/v1/threads/batch/read")
                        .header("Authorization", authToken)
                        .header("X-Workspace-Id", workspace.getId().toString())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }

    @Test
    void testSendReply_AppendsMessageAndMarksNeedsReplyFalse() throws Exception {
        SendReplyRequest req = new SendReplyRequest("Thank you Sarah, let's connect Thursday.", "sarah@kinto.ventures");

        mockMvc.perform(post("/api/v1/threads/" + thread.getId() + "/reply")
                        .header("Authorization", authToken)
                        .header("X-Workspace-Id", workspace.getId().toString())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.messages", hasSize(2)))
                .andExpect(jsonPath("$.data.isNeedsReply").value(false))
                .andExpect(jsonPath("$.data.isSent").value(true));
    }

    @Test
    void testSendNewEmail_CreatesSentThread() throws Exception {
        SendEmailRequest req = new SendEmailRequest("dr.hayes@deeptech.org", "Whitepaper Feedback", "Here is the new draft.");

        mockMvc.perform(post("/api/v1/threads/send")
                        .header("Authorization", authToken)
                        .header("X-Workspace-Id", workspace.getId().toString())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.subject").value("Whitepaper Feedback"))
                .andExpect(jsonPath("$.data.isSent").value(true));
    }
}
