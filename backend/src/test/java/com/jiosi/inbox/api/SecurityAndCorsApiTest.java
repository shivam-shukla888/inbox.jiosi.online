package com.jiosi.inbox.api;

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
import org.springframework.http.HttpHeaders;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.not;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class SecurityAndCorsApiTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private AuthTokenService authTokenService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private WorkspaceRepository workspaceRepository;

    @Autowired
    private WorkspaceMemberRepository workspaceMemberRepository;

    private User alice;
    private User bob;
    private Workspace aliceWorkspace;
    private Workspace bobWorkspace;
    private String aliceToken;
    private String bobToken;

    @BeforeEach
    void setUp() {
        alice = userRepository.save(new User("alice-" + UUID.randomUUID() + "@jiosi.online", "Alice Rivera", "AR"));
        bob = userRepository.save(new User("bob-" + UUID.randomUUID() + "@jiosi.online", "Bob Smith", "BS"));

        aliceWorkspace = workspaceRepository.save(new Workspace("Alice WS", "alice-ws-" + UUID.randomUUID(), alice));
        bobWorkspace = workspaceRepository.save(new Workspace("Bob WS", "bob-ws-" + UUID.randomUUID(), bob));

        workspaceMemberRepository.save(new WorkspaceMember(aliceWorkspace, alice, "OWNER"));
        workspaceMemberRepository.save(new WorkspaceMember(bobWorkspace, bob, "OWNER"));

        aliceToken = "Bearer " + authTokenService.generateToken(alice);
        bobToken = "Bearer " + authTokenService.generateToken(bob);
    }

    @Test
    void testCors_AllowedOrigin_ShouldIncludeAccessControlHeaders() throws Exception {
        mockMvc.perform(options("/api/v1/health")
                        .header(HttpHeaders.ORIGIN, "http://localhost:3000")
                        .header(HttpHeaders.ACCESS_CONTROL_REQUEST_METHOD, "GET"))
                .andExpect(status().isOk())
                .andExpect(header().string(HttpHeaders.ACCESS_CONTROL_ALLOW_ORIGIN, "http://localhost:3000"))
                .andExpect(header().exists(HttpHeaders.ACCESS_CONTROL_ALLOW_METHODS));
    }

    @Test
    void testHealthEndpoint_UnsupportedPostMethod_ShouldReturn405MethodNotAllowed() throws Exception {
        mockMvc.perform(post("/api/v1/health"))
                .andExpect(status().isMethodNotAllowed());
    }

    @Test
    void testHealthEndpoint_PayloadDoesNotExposeDatabaseSecrets() throws Exception {
        mockMvc.perform(get("/api/v1/health"))
                .andExpect(status().isOk())
                .andExpect(content().string(not(containsString("password"))))
                .andExpect(content().string(not(containsString("secret"))))
                .andExpect(content().string(not(containsString("jdbc:postgresql"))));
    }

    @Test
    void testUnauthenticatedAccess_Threads_ShouldReturn401Unauthorized() throws Exception {
        mockMvc.perform(get("/api/v1/threads")
                        .header("X-Workspace-Id", aliceWorkspace.getId()))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.code").value("UNAUTHORIZED"));
    }

    @Test
    void testInvalidToken_Threads_ShouldReturn401Unauthorized() throws Exception {
        mockMvc.perform(get("/api/v1/threads")
                        .header("Authorization", "Bearer invalid-garbage-token-string")
                        .header("X-Workspace-Id", aliceWorkspace.getId()))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.code").value("UNAUTHORIZED"));
    }

    @Test
    void testCrossWorkspaceAccess_BobAccessingAliceWorkspace_ShouldReturn403Forbidden() throws Exception {
        // Bob is authenticated, but is NOT a member of Alice's workspace
        mockMvc.perform(get("/api/v1/threads")
                        .header("Authorization", bobToken)
                        .header("X-Workspace-Id", aliceWorkspace.getId()))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.code").value("WORKSPACE_ACCESS_DENIED"));
    }

    @Test
    void testAuthorizedWorkspaceAccess_AliceAccessingAliceWorkspace_ShouldReturn200Ok() throws Exception {
        // Alice is authenticated and IS the owner of Alice's workspace
        mockMvc.perform(get("/api/v1/threads")
                        .header("Authorization", aliceToken)
                        .header("X-Workspace-Id", aliceWorkspace.getId()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }

    @Test
    void testAuthTokenEndpoint_ShouldReturnValidToken() throws Exception {
        mockMvc.perform(post("/api/v1/auth/token")
                        .contentType("application/json")
                        .content("{\"email\":\"" + alice.getEmail() + "\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.token").exists())
                .andExpect(jsonPath("$.data.email").value(alice.getEmail()));
    }
}
