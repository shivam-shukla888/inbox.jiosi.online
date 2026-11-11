package com.jiosi.inbox.api;

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
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.UUID;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.options;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@TestPropertySource(properties = {
        "app.cors.allowed-extension-ids=abcdefghijklmnopabcdefghijklmnop",
        "app.cors.allowed-origins=https://inbox.jiosi.online"
})
@Transactional
class ExtensionApiIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private WorkspaceRepository workspaceRepository;

    @Autowired
    private WorkspaceMemberRepository workspaceMemberRepository;

    @Autowired
    private EmailThreadRepository threadRepository;

    @Autowired
    private AuthTokenService authTokenService;

    private User testUser;
    private Workspace testWorkspace;
    private Workspace unauthorizedWorkspace;
    private EmailThread testThread;
    private String validJwtToken;

    @BeforeEach
    void setUp() {
        testUser = new User();
        testUser.setEmail("extension.user@jiosi.online");
        testUser.setFullName("Extension User");
        testUser.setAvatarUrl("https://jiosi.online/avatar.png");
        testUser = userRepository.save(testUser);

        User otherOwner = new User();
        otherOwner.setEmail("other.owner@jiosi.online");
        otherOwner.setFullName("Other Owner");
        otherOwner.setAvatarUrl("https://jiosi.online/avatar2.png");
        otherOwner = userRepository.save(otherOwner);

        testWorkspace = new Workspace("Extension Test Workspace", "ext-ws-" + UUID.randomUUID(), testUser);
        testWorkspace = workspaceRepository.save(testWorkspace);

        WorkspaceMember member = new WorkspaceMember(testWorkspace, testUser, "OWNER");
        workspaceMemberRepository.save(member);

        unauthorizedWorkspace = new Workspace("Other User Workspace", "other-ws-" + UUID.randomUUID(), otherOwner);
        unauthorizedWorkspace = workspaceRepository.save(unauthorizedWorkspace);

        testThread = new EmailThread();
        testThread.setWorkspace(testWorkspace);
        testThread.setSubject("Q4 Contract Review & Deliverables");
        testThread.setSenderName("Client Alex");
        testThread.setSenderEmail("alex@client.com");
        testThread.setRecipientName("Extension User");
        testThread.setRecipientEmail("extension.user@jiosi.online");
        testThread.setSnippet("Please review the attached contract.");
        testThread.setExternalThreadId("gmail_thread_ext_9999");
        testThread.setLastMessageAt(Instant.now());
        testThread = threadRepository.save(testThread);

        validJwtToken = authTokenService.generateToken(testUser);
    }

    @Test
    @DisplayName("Unauthenticated extension request to thread endpoint returns 401")
    void testUnauthenticatedExtensionRequestReturns401() throws Exception {
        mockMvc.perform(get("/api/v1/threads/by-external/gmail_thread_ext_9999")
                        .header("X-Workspace-Id", testWorkspace.getId().toString()))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.code").value("UNAUTHORIZED"));
    }

    @Test
    @DisplayName("Extension request with valid user token but unauthorized workspace returns 403")
    void testWorkspaceUnauthorizedExtensionRequestReturns403() throws Exception {
        mockMvc.perform(get("/api/v1/threads/by-external/gmail_thread_ext_9999")
                        .header("Authorization", "Bearer " + validJwtToken)
                        .header("X-Workspace-Id", unauthorizedWorkspace.getId().toString()))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.code").value("WORKSPACE_ACCESS_DENIED"));
    }

    @Test
    @DisplayName("Extension request with valid token and workspace succeeds")
    void testSuccessfulExtensionApiCall() throws Exception {
        mockMvc.perform(get("/api/v1/threads/by-external/gmail_thread_ext_9999")
                        .header("Authorization", "Bearer " + validJwtToken)
                        .header("X-Workspace-Id", testWorkspace.getId().toString()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.id").value(testThread.getId().toString()))
                .andExpect(jsonPath("$.data.subject").value("Q4 Contract Review & Deliverables"));
    }

    @Test
    @DisplayName("CORS preflight from configured Chrome extension origin returns allow-origin and credentials")
    void testAllowedExtensionOriginReceivesCorsHeaders() throws Exception {
        mockMvc.perform(options("/api/v1/threads/by-external/gmail_thread_ext_9999")
                        .header("Origin", "chrome-extension://abcdefghijklmnopabcdefghijklmnop")
                        .header("Access-Control-Request-Method", "GET"))
                .andExpect(status().isOk())
                .andExpect(header().string("Access-Control-Allow-Origin", "chrome-extension://abcdefghijklmnopabcdefghijklmnop"))
                .andExpect(header().string("Access-Control-Allow-Credentials", "true"));
    }

    @Test
    @DisplayName("CORS preflight from disallowed origin is rejected without allow-origin header")
    void testDisallowedOriginRejectedInCors() throws Exception {
        mockMvc.perform(options("/api/v1/threads/by-external/gmail_thread_ext_9999")
                        .header("Origin", "chrome-extension://unauthorizedextensionidunauthoriz")
                        .header("Access-Control-Request-Method", "GET"))
                .andExpect(header().doesNotExist("Access-Control-Allow-Origin"));
    }
}
