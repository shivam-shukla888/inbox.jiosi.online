package com.jiosi.inbox.api;

import com.jiosi.inbox.security.AuthTokenService;
import com.jiosi.inbox.user.User;
import com.jiosi.inbox.user.UserRepository;
import com.jiosi.inbox.workspace.Workspace;
import com.jiosi.inbox.workspace.WorkspaceMember;
import com.jiosi.inbox.workspace.WorkspaceMemberRepository;
import com.jiosi.inbox.workspace.WorkspaceRepository;
import jakarta.servlet.http.Cookie;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.not;
import static org.junit.jupiter.api.Assertions.assertNotNull;
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
    void testDevTokenBackdoor_ShouldBeRejectedWith401Unauthorized() throws Exception {
        // Confirm the dev backdoor was eliminated: dev-token prefix must fail signature check
        mockMvc.perform(get("/api/v1/threads")
                        .header("Authorization", "Bearer dev-token-" + alice.getId())
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
    void testLegacyInsecureTokenEndpoint_ShouldBeRemoved() throws Exception {
        // Legacy /api/v1/auth/token endpoint must be removed or reject unauthenticated access
        mockMvc.perform(post("/api/v1/auth/token")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"" + alice.getEmail() + "\"}"))
                .andExpect(status().is4xxClientError());
    }

    @Test
    void testGoogleAuth_ValidToken_ShouldAuthenticateAndProvisionUser() throws Exception {
        String testToken = "test-google-token:google-sub-alice:alice.google@jiosi.online:Alice Google:true";

        MvcResult result = mockMvc.perform(post("/api/v1/auth/google")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"idToken\":\"" + testToken + "\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.email").value("alice.google@jiosi.online"))
                .andExpect(jsonPath("$.data.fullName").value("Alice Google"))
                .andExpect(jsonPath("$.data.token").exists())
                .andExpect(jsonPath("$.data.defaultWorkspaceId").exists())
                .andExpect(jsonPath("$.data.role").value("OWNER"))
                .andReturn();

        assertNotNull(result.getRequest().getSession(false), "HTTP Session should be established");
    }

    @Test
    void testGoogleAuth_UnverifiedEmail_ShouldReturn401() throws Exception {
        // unverified email flag in test token
        String unverifiedToken = "test-google-token:google-sub-unverified:unverified@jiosi.online:Unverified User:false";

        mockMvc.perform(post("/api/v1/auth/google")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"idToken\":\"" + unverifiedToken + "\"}"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.code").value("UNAUTHORIZED"));
    }

    @Test
    void testGoogleAuth_ExpiredToken_ShouldReturn401() throws Exception {
        String expiredToken = "test-google-token:expired";

        mockMvc.perform(post("/api/v1/auth/google")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"idToken\":\"" + expiredToken + "\"}"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.code").value("UNAUTHORIZED"));
    }

    @Test
    void testGoogleAuth_AudienceMismatch_ShouldReturn401() throws Exception {
        String mismatchedToken = "test-google-token:audience-mismatch";

        mockMvc.perform(post("/api/v1/auth/google")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"idToken\":\"" + mismatchedToken + "\"}"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.code").value("UNAUTHORIZED"));
    }

    @Test
    void testGoogleAuth_IdentityCollision_ShouldReturn401() throws Exception {
        // Setup existing user bound to a different subject
        User existingUser = new User("collision@jiosi.online", "Collision User", null);
        existingUser.setGoogleSubject("existing-google-sub-999");
        existingUser.setEmailVerified(true);
        userRepository.save(existingUser);

        // Attempt to log in with a DIFFERENT subject but the same email
        String conflictingToken = "test-google-token:new-different-sub:collision@jiosi.online:Attacker:true";

        mockMvc.perform(post("/api/v1/auth/google")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"idToken\":\"" + conflictingToken + "\"}"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.code").value("UNAUTHORIZED"));
    }

    @Test
    void testGetMe_AuthenticatedSession_ShouldReturnProfile() throws Exception {
        mockMvc.perform(get("/api/v1/auth/me")
                        .header("Authorization", aliceToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.email").value(alice.getEmail()))
                .andExpect(jsonPath("$.data.defaultWorkspaceId").value(aliceWorkspace.getId().toString()));
    }

    @Test
    void testGetMe_Unauthenticated_ShouldReturn401() throws Exception {
        mockMvc.perform(get("/api/v1/auth/me"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.code").value("UNAUTHORIZED"));
    }

    @Test
    void testLogout_ShouldInvalidateSessionAndClearCookies() throws Exception {
        MockHttpSession session = new MockHttpSession();

        mockMvc.perform(post("/api/v1/auth/logout")
                        .session(session)
                        .header("Authorization", aliceToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }

    @Test
    void testCsrfEndpoint_ShouldReturnCsrfToken() throws Exception {
        mockMvc.perform(get("/api/v1/auth/csrf"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }

    @Test
    void testInvalidWorkspaceIdFormat_ShouldReturn400BadRequest() throws Exception {
        mockMvc.perform(get("/api/v1/threads")
                        .header("Authorization", aliceToken)
                        .header("X-Workspace-Id", "not-a-valid-uuid"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("BAD_REQUEST"));
    }
}
