package com.jiosi.inbox.security;

import com.jiosi.inbox.common.WorkspaceAccessDeniedException;
import com.jiosi.inbox.config.CustomOAuth2AuthorizationRequestResolver;
import com.jiosi.inbox.connectedaccount.ConnectedAccountRepository;
import com.jiosi.inbox.gmail.GmailController;
import com.jiosi.inbox.user.User;
import com.jiosi.inbox.user.UserRepository;
import com.jiosi.inbox.workspace.Workspace;
import com.jiosi.inbox.workspace.WorkspaceMemberRepository;
import com.jiosi.inbox.workspace.WorkspaceRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.client.OAuth2AuthorizedClientService;
import org.springframework.security.oauth2.client.authentication.OAuth2AuthenticationToken;
import org.springframework.security.oauth2.client.registration.ClientRegistration;
import org.springframework.security.oauth2.client.registration.ClientRegistrationRepository;
import org.springframework.security.oauth2.client.registration.InMemoryClientRegistrationRepository;
import org.springframework.security.oauth2.core.AuthorizationGrantType;
import org.springframework.security.oauth2.core.endpoint.OAuth2AuthorizationRequest;
import org.springframework.security.oauth2.core.user.OAuth2User;

import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class OAuth2RedirectUriTests {

    private ClientRegistrationRepository registrationRepository;

    @BeforeEach
    void setUp() {
        ClientRegistration googleRegistration = ClientRegistration.withRegistrationId("google")
                .clientId("test-google-client-id")
                .clientSecret("test-google-client-secret")
                .authorizationGrantType(AuthorizationGrantType.AUTHORIZATION_CODE)
                .redirectUri("{baseUrl}/login/oauth2/code/{registrationId}")
                .authorizationUri("https://accounts.google.com/o/oauth2/v2/auth")
                .tokenUri("https://oauth2.googleapis.com/token")
                .userInfoUri("https://openidconnect.googleapis.com/v1/userinfo")
                .userNameAttributeName("sub")
                .scope("openid", "profile", "email")
                .clientName("Google")
                .build();

        registrationRepository = new InMemoryClientRegistrationRepository(googleRegistration);
    }

    // =========================================================================
    // PRIORITY 2: STRICT URI VALIDATION & REDIRECT ALIGNMENT TESTS
    // =========================================================================

    @Test
    @DisplayName("Local Development: Resolver preserves localhost:8080 redirect_uri")
    void testLocalDevRedirectUri_Preserved() {
        CustomOAuth2AuthorizationRequestResolver resolver =
                new CustomOAuth2AuthorizationRequestResolver(registrationRepository, "http://localhost:5173");

        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/oauth2/authorization/google");
        request.setServletPath("/oauth2/authorization/google");
        request.setServerName("localhost");
        request.setServerPort(8080);
        request.setScheme("http");

        OAuth2AuthorizationRequest authReq = resolver.resolve(request);
        assertNotNull(authReq);
        assertEquals("http://localhost:8080/login/oauth2/code/google", authReq.getRedirectUri());
    }

    @Test
    @DisplayName("Production: Resolver aligns onrender.com backend host to inbox.jiosi.online frontend domain")
    void testProductionRedirectUri_AlignedToFrontendDomain() {
        CustomOAuth2AuthorizationRequestResolver resolver =
                new CustomOAuth2AuthorizationRequestResolver(registrationRepository, "https://inbox.jiosi.online");

        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/oauth2/authorization/google");
        request.setServletPath("/oauth2/authorization/google");
        request.setServerName("jiosi-inbox-api.onrender.com");
        request.setServerPort(443);
        request.setScheme("https");

        OAuth2AuthorizationRequest authReq = resolver.resolve(request);
        assertNotNull(authReq);
        assertEquals("https://inbox.jiosi.online/login/oauth2/code/google", authReq.getRedirectUri());
    }

    @Test
    @DisplayName("Production: Exact valid frontend origin is preserved without mutation")
    void testValidProductionOrigin_NotMutated() {
        ClientRegistration prodReg = ClientRegistration.withRegistrationId("google")
                .clientId("test-id")
                .clientSecret("test-secret")
                .authorizationGrantType(AuthorizationGrantType.AUTHORIZATION_CODE)
                .redirectUri("https://inbox.jiosi.online/login/oauth2/code/google")
                .authorizationUri("https://accounts.google.com/o/oauth2/v2/auth")
                .tokenUri("https://oauth2.googleapis.com/token")
                .build();

        CustomOAuth2AuthorizationRequestResolver resolver =
                new CustomOAuth2AuthorizationRequestResolver(new InMemoryClientRegistrationRepository(prodReg), "https://inbox.jiosi.online");

        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/oauth2/authorization/google");
        request.setServletPath("/oauth2/authorization/google");

        OAuth2AuthorizationRequest authReq = resolver.resolve(request);
        assertNotNull(authReq);
        assertEquals("https://inbox.jiosi.online/login/oauth2/code/google", authReq.getRedirectUri());
    }

    @Test
    @DisplayName("Security: Lookalike host is rejected by strict origin matching and aligned to valid frontend domain")
    void testLookalikeHost_AlignedToFrontendDomain() {
        ClientRegistration lookalikeReg = ClientRegistration.withRegistrationId("google")
                .clientId("test-id")
                .clientSecret("test-secret")
                .authorizationGrantType(AuthorizationGrantType.AUTHORIZATION_CODE)
                .redirectUri("https://inbox.jiosi.online.attacker.example/login/oauth2/code/google")
                .authorizationUri("https://accounts.google.com/o/oauth2/v2/auth")
                .tokenUri("https://oauth2.googleapis.com/token")
                .build();

        CustomOAuth2AuthorizationRequestResolver resolver =
                new CustomOAuth2AuthorizationRequestResolver(new InMemoryClientRegistrationRepository(lookalikeReg), "https://inbox.jiosi.online");

        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/oauth2/authorization/google");
        request.setServletPath("/oauth2/authorization/google");

        OAuth2AuthorizationRequest authReq = resolver.resolve(request);
        assertNotNull(authReq);
        assertEquals("https://inbox.jiosi.online/login/oauth2/code/google", authReq.getRedirectUri());
        assertFalse(authReq.getRedirectUri().contains("attacker.example"));
    }

    @Test
    @DisplayName("Security: Alternate port is rejected by strict origin matching and aligned to port 443")
    void testAlternatePort_AlignedToFrontendDomain() {
        ClientRegistration altPortReg = ClientRegistration.withRegistrationId("google")
                .clientId("test-id")
                .clientSecret("test-secret")
                .authorizationGrantType(AuthorizationGrantType.AUTHORIZATION_CODE)
                .redirectUri("https://inbox.jiosi.online:8443/login/oauth2/code/google")
                .authorizationUri("https://accounts.google.com/o/oauth2/v2/auth")
                .tokenUri("https://oauth2.googleapis.com/token")
                .build();

        CustomOAuth2AuthorizationRequestResolver resolver =
                new CustomOAuth2AuthorizationRequestResolver(new InMemoryClientRegistrationRepository(altPortReg), "https://inbox.jiosi.online");

        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/oauth2/authorization/google");
        request.setServletPath("/oauth2/authorization/google");

        OAuth2AuthorizationRequest authReq = resolver.resolve(request);
        assertNotNull(authReq);
        assertEquals("https://inbox.jiosi.online/login/oauth2/code/google", authReq.getRedirectUri());
    }

    @Test
    @DisplayName("Security: Malformed or unsafe frontend URLs are rejected at startup")
    void testMalformedOrUnsafeFrontendUrl_RejectedAtStartup() {
        assertThrows(IllegalArgumentException.class, () ->
                new CustomOAuth2AuthorizationRequestResolver(registrationRepository, "javascript:alert(1)"));
        assertThrows(IllegalArgumentException.class, () ->
                new CustomOAuth2AuthorizationRequestResolver(registrationRepository, "https://user:pass@inbox.jiosi.online"));
        assertThrows(IllegalArgumentException.class, () ->
                new CustomOAuth2AuthorizationRequestResolver(registrationRepository, "https://inbox.jiosi.online?param=val"));
        assertThrows(IllegalArgumentException.class, () ->
                new CustomOAuth2AuthorizationRequestResolver(registrationRepository, "https://inbox.jiosi.online#frag"));
        assertThrows(IllegalArgumentException.class, () ->
                new CustomOAuth2AuthorizationRequestResolver(registrationRepository, "inbox.jiosi.online"));
    }

    // =========================================================================
    // PRIORITY 1: SECURITY HARDENING & SERVER-SIDE PRINCIPAL BINDING TESTS
    // =========================================================================

    @Test
    @DisplayName("Security: Untrusted query parameters (user_id, workspace_id) are NOT persisted to session")
    void testUntrustedQueryParameters_NotPersistedToSession() {
        CustomOAuth2AuthorizationRequestResolver resolver =
                new CustomOAuth2AuthorizationRequestResolver(registrationRepository, "https://inbox.jiosi.online");

        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/oauth2/authorization/google");
        request.setServletPath("/oauth2/authorization/google");
        request.setParameter("action", "connect_gmail");
        request.setParameter("user_id", "attacker-user-id");
        request.setParameter("workspace_id", "attacker-workspace-id");

        OAuth2AuthorizationRequest authReq = resolver.resolve(request);
        assertNotNull(authReq);
        assertTrue(authReq.getScopes().contains("https://www.googleapis.com/auth/gmail.readonly"));

        MockHttpSession session = (MockHttpSession) request.getSession(false);
        assertNotNull(session);
        assertEquals(Boolean.TRUE, session.getAttribute(CustomOAuth2AuthorizationRequestResolver.SESSION_GMAIL_CONNECT_ACTION));
        // Untrusted browser query parameters MUST be ignored
        assertNull(session.getAttribute(CustomOAuth2AuthorizationRequestResolver.SESSION_CONNECTING_USER_ID));
        assertNull(session.getAttribute(CustomOAuth2AuthorizationRequestResolver.SESSION_CONNECTING_WORKSPACE_ID));
    }

    @Test
    @DisplayName("GmailController: Rejects unauthorized workspace access at the connect-url endpoint")
    void testGmailController_RejectsUnauthorizedWorkspaceAccess() {
        UUID unauthorizedWsId = UUID.randomUUID();
        User testUser = new User("user@jiosi.online", "Test User", null);
        testUser.setId(UUID.randomUUID());

        // Java subclass stub avoiding Mockito class agent restrictions on Java 24
        WorkspaceAuthorizationService stubAuthService = new WorkspaceAuthorizationService(null, null) {
            @Override
            public WorkspaceMemberAccess validateAccess(UUID workspaceId, User user) {
                if (unauthorizedWsId.equals(workspaceId)) {
                    throw new WorkspaceAccessDeniedException("Access denied");
                }
                return null;
            }
        };

        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(testUser, null, List.of(new SimpleGrantedAuthority("ROLE_USER")))
        );

        GmailController controller = new GmailController(
                null,
                stubAuthService,
                "https://inbox.jiosi.online",
                "http://localhost:8080"
        );

        MockHttpServletRequest request = new MockHttpServletRequest();
        assertThrows(WorkspaceAccessDeniedException.class, () ->
                controller.getConnectUrl(unauthorizedWsId, request));
    }

    @Test
    @DisplayName("GmailController: Binds authenticated principal and authorized workspace to server session")
    void testGmailController_BindsAuthenticatedPrincipalAndWorkspaceToSession() {
        UUID authorizedWsId = UUID.randomUUID();
        User testUser = new User("user@jiosi.online", "Test User", null);
        UUID userId = UUID.randomUUID();
        testUser.setId(userId);

        Workspace ws = new Workspace("My WS", "desc", testUser);
        ws.setId(authorizedWsId);

        // Java subclass stub avoiding Mockito class agent restrictions on Java 24
        WorkspaceAuthorizationService stubAuthService = new WorkspaceAuthorizationService(null, null) {
            @Override
            public WorkspaceMemberAccess validateAccess(UUID workspaceId, User user) {
                if (authorizedWsId.equals(workspaceId)) {
                    return new WorkspaceMemberAccess(ws, user, "OWNER");
                }
                throw new WorkspaceAccessDeniedException("Access denied");
            }
        };

        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(testUser, null, List.of(new SimpleGrantedAuthority("ROLE_USER")))
        );

        GmailController controller = new GmailController(
                null,
                stubAuthService,
                "https://inbox.jiosi.online",
                "http://localhost:8080"
        );

        MockHttpServletRequest request = new MockHttpServletRequest();
        var response = controller.getConnectUrl(authorizedWsId, request);
        assertNotNull(response.getBody());
        String connectUrl = response.getBody().data().get("connectUrl");

        // The URL must NOT leak user_id or workspace_id in query string
        assertEquals("https://inbox.jiosi.online/oauth2/authorization/google?action=connect_gmail", connectUrl);
        assertFalse(connectUrl.contains("user_id="));
        assertFalse(connectUrl.contains("workspace_id="));

        // State is stored in server-side session
        MockHttpSession session = (MockHttpSession) request.getSession(false);
        assertNotNull(session);
        assertEquals(Boolean.TRUE, session.getAttribute(CustomOAuth2AuthorizationRequestResolver.SESSION_GMAIL_CONNECT_ACTION));
        assertEquals(userId.toString(), session.getAttribute(CustomOAuth2AuthorizationRequestResolver.SESSION_CONNECTING_USER_ID));
        assertEquals(authorizedWsId.toString(), session.getAttribute(CustomOAuth2AuthorizationRequestResolver.SESSION_CONNECTING_WORKSPACE_ID));
    }

    @Test
    @DisplayName("OAuth2 Success Handler: Rejects Gmail linking when session has no authenticated principal")
    void testOAuth2SuccessHandler_RejectsUnauthenticatedSession() throws Exception {
        User user = new User("test@jiosi.online", "Test User", null);
        user.setId(UUID.randomUUID());

        UserProvisioningService stubUps = new UserProvisioningService(null, null, null) {
            @Override
            public User linkOrCreateGoogleUser(GoogleIdentity identity) {
                return user;
            }
        };

        OAuth2AuthenticationSuccessHandler handler = new OAuth2AuthenticationSuccessHandler(
                stubUps,
                mock(UserRepository.class),
                mock(OAuth2AuthorizedClientService.class),
                mock(ConnectedAccountRepository.class),
                null, // tokenEncryptionService (not invoked on rejection)
                mock(WorkspaceRepository.class),
                mock(WorkspaceMemberRepository.class),
                null,
                "https://inbox.jiosi.online"
        );

        MockHttpServletRequest request = new MockHttpServletRequest();
        MockHttpServletResponse response = new MockHttpServletResponse();
        MockHttpSession session = new MockHttpSession();
        session.setAttribute(CustomOAuth2AuthorizationRequestResolver.SESSION_GMAIL_CONNECT_ACTION, Boolean.TRUE);
        // NO user_id in session
        request.setSession(session);

        OAuth2User oauthUser = mock(OAuth2User.class);
        when(oauthUser.getName()).thenReturn("google-sub-123");
        when(oauthUser.getAttributes()).thenReturn(Map.of("email", "test@jiosi.online", "email_verified", true));

        OAuth2AuthenticationToken authToken = new OAuth2AuthenticationToken(
                oauthUser,
                List.of(new SimpleGrantedAuthority("ROLE_USER")),
                "google"
        );

        handler.onAuthenticationSuccess(request, response, authToken);

        assertEquals(302, response.getStatus());
        String redirectUrl = response.getRedirectedUrl();
        assertNotNull(redirectUrl);
        assertTrue(redirectUrl.contains("auth_error="));
        assertTrue(redirectUrl.contains("authenticated+session"));
    }

    @Test
    @DisplayName("OAuth2 Success Handler: Rejects Gmail linking when user is not authorized for workspace")
    void testOAuth2SuccessHandler_RejectsUnauthorizedWorkspace() throws Exception {
        UserRepository mockUserRepo = mock(UserRepository.class);
        ConnectedAccountRepository mockConnectedAccountRepo = mock(ConnectedAccountRepository.class);

        UUID userId = UUID.randomUUID();
        UUID unauthorizedWsId = UUID.randomUUID();
        User user = new User("test@jiosi.online", "Test User", null);
        user.setId(userId);

        UserProvisioningService stubUps = new UserProvisioningService(null, null, null) {
            @Override
            public User linkOrCreateGoogleUser(GoogleIdentity identity) {
                return user;
            }
        };

        WorkspaceAuthorizationService stubDenyingAuthService = new WorkspaceAuthorizationService(null, null) {
            @Override
            public WorkspaceMemberAccess validateAccess(UUID workspaceId, User targetUser) {
                throw new WorkspaceAccessDeniedException("User not in workspace");
            }
        };

        when(mockUserRepo.findById(userId)).thenReturn(Optional.of(user));

        OAuth2AuthenticationSuccessHandler testHandler = new OAuth2AuthenticationSuccessHandler(
                stubUps,
                mockUserRepo,
                mock(OAuth2AuthorizedClientService.class),
                mockConnectedAccountRepo,
                null, // tokenEncryptionService (not invoked on rejection)
                mock(WorkspaceRepository.class),
                mock(WorkspaceMemberRepository.class),
                stubDenyingAuthService,
                "https://inbox.jiosi.online"
        );

        MockHttpServletRequest request = new MockHttpServletRequest();
        MockHttpServletResponse response = new MockHttpServletResponse();
        MockHttpSession session = new MockHttpSession();
        session.setAttribute(CustomOAuth2AuthorizationRequestResolver.SESSION_GMAIL_CONNECT_ACTION, Boolean.TRUE);
        session.setAttribute(CustomOAuth2AuthorizationRequestResolver.SESSION_CONNECTING_USER_ID, userId.toString());
        session.setAttribute(CustomOAuth2AuthorizationRequestResolver.SESSION_CONNECTING_WORKSPACE_ID, unauthorizedWsId.toString());
        request.setSession(session);

        OAuth2User oauthUser = mock(OAuth2User.class);
        when(oauthUser.getName()).thenReturn("google-sub-123");
        when(oauthUser.getAttributes()).thenReturn(Map.of("email", "test@jiosi.online", "email_verified", true));

        OAuth2AuthenticationToken authToken = new OAuth2AuthenticationToken(
                oauthUser,
                List.of(new SimpleGrantedAuthority("ROLE_USER")),
                "google"
        );

        testHandler.onAuthenticationSuccess(request, response, authToken);

        assertEquals(302, response.getStatus());
        String redirectUrl = response.getRedirectedUrl();
        assertNotNull(redirectUrl);
        assertTrue(redirectUrl.contains("auth_error="));
        assertTrue(redirectUrl.contains("Access+denied"));

        // Verify NO connected account was saved
        verify(mockConnectedAccountRepo, never()).save(any());
    }

    @Test
    @DisplayName("OAuth2 Failure Handler: Redirects to frontendUrl with encoded safe error")
    void testFailureHandler_RedirectsToFrontendUrl() throws Exception {
        OAuth2AuthenticationFailureHandler failureHandler =
                new OAuth2AuthenticationFailureHandler("https://inbox.jiosi.online");

        MockHttpServletRequest request = new MockHttpServletRequest();
        MockHttpServletResponse response = new MockHttpServletResponse();
        AuthenticationException authEx = new AuthenticationException("State mismatch or invalid grant") {};

        failureHandler.onAuthenticationFailure(request, response, authEx);

        assertEquals(302, response.getStatus());
        String redirectUrl = response.getRedirectedUrl();
        assertNotNull(redirectUrl);
        assertTrue(redirectUrl.startsWith("https://inbox.jiosi.online/?auth_error="));
        assertFalse(redirectUrl.contains("jiosi-inbox-api.onrender.com"));
    }
}
