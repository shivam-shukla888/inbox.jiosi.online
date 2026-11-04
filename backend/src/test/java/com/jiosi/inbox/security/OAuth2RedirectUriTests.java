package com.jiosi.inbox.security;

import com.jiosi.inbox.config.CustomOAuth2AuthorizationRequestResolver;
import com.jiosi.inbox.gmail.GmailController;
import com.jiosi.inbox.gmail.GmailService;
import com.jiosi.inbox.user.User;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.client.registration.ClientRegistration;
import org.springframework.security.oauth2.client.registration.ClientRegistrationRepository;
import org.springframework.security.oauth2.client.registration.InMemoryClientRegistrationRepository;
import org.springframework.security.oauth2.core.AuthorizationGrantType;
import org.springframework.security.oauth2.core.endpoint.OAuth2AuthorizationRequest;

import java.util.List;
import java.util.Map;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.mock;

class OAuth2RedirectUriTests {

    private ClientRegistration googleRegistration;
    private ClientRegistrationRepository registrationRepository;

    @BeforeEach
    void setUp() {
        googleRegistration = ClientRegistration.withRegistrationId("google")
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

        // Simulating request hitting backend through Vercel where host was onrender.com
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
    @DisplayName("Production Config: Direct registration redirect_uri template matches inbox.jiosi.online")
    void testProductionClientRegistrationTemplate_MatchesInboxDomain() {
        ClientRegistration prodRegistration = ClientRegistration.withRegistrationId("google")
                .clientId("test-google-client-id")
                .clientSecret("test-google-client-secret")
                .authorizationGrantType(AuthorizationGrantType.AUTHORIZATION_CODE)
                .redirectUri("https://inbox.jiosi.online/login/oauth2/code/{registrationId}")
                .authorizationUri("https://accounts.google.com/o/oauth2/v2/auth")
                .tokenUri("https://oauth2.googleapis.com/token")
                .userNameAttributeName("sub")
                .scope("openid", "profile", "email")
                .build();

        ClientRegistrationRepository prodRepo = new InMemoryClientRegistrationRepository(prodRegistration);
        CustomOAuth2AuthorizationRequestResolver resolver =
                new CustomOAuth2AuthorizationRequestResolver(prodRepo, "https://inbox.jiosi.online");

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
    @DisplayName("Gmail Connect: Incremental authorization includes gmail.readonly and retains aligned redirect_uri")
    void testGmailConnectIncrementalAuth_RetainsAlignedRedirectUri() {
        CustomOAuth2AuthorizationRequestResolver resolver =
                new CustomOAuth2AuthorizationRequestResolver(registrationRepository, "https://inbox.jiosi.online");

        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/oauth2/authorization/google");
        request.setServletPath("/oauth2/authorization/google");
        request.setParameter("action", "connect_gmail");
        request.setParameter("user_id", UUID.randomUUID().toString());
        request.setServerName("jiosi-inbox-api.onrender.com");
        request.setServerPort(443);
        request.setScheme("https");

        OAuth2AuthorizationRequest authReq = resolver.resolve(request);
        assertNotNull(authReq);
        assertEquals("https://inbox.jiosi.online/login/oauth2/code/google", authReq.getRedirectUri());
        assertTrue(authReq.getScopes().contains("https://www.googleapis.com/auth/gmail.readonly"));
        assertEquals("offline", authReq.getAdditionalParameters().get("access_type"));
        assertEquals("consent", authReq.getAdditionalParameters().get("prompt"));
    }

    @Test
    @DisplayName("GmailController: Generates public frontend connect URL in production")
    void testGmailController_GeneratesFrontendConnectUrlInProduction() {
        GmailController controller = new GmailController(
                null,
                "https://inbox.jiosi.online",
                "http://localhost:8080"
        );

        User testUser = new User("user@jiosi.online", "Test User", null);
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(testUser, null, List.of(new SimpleGrantedAuthority("ROLE_USER")))
        );

        UUID wsId = UUID.randomUUID();
        var response = controller.getConnectUrl(wsId);
        assertNotNull(response.getBody());
        Map<String, String> data = response.getBody().data();
        assertNotNull(data);
        String connectUrl = data.get("connectUrl");

        assertTrue(connectUrl.startsWith("https://inbox.jiosi.online/oauth2/authorization/google"));
        assertTrue(connectUrl.contains("action=connect_gmail"));
        assertTrue(connectUrl.contains("workspace_id=" + wsId));
    }

    @Test
    @DisplayName("GmailController: Generates backend localhost URL in local development")
    void testGmailController_GeneratesLocalhostConnectUrlInDev() {
        GmailController controller = new GmailController(
                null,
                "http://localhost:5173",
                "http://localhost:8080"
        );

        User testUser = new User("user@jiosi.online", "Test User", null);
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(testUser, null, List.of(new SimpleGrantedAuthority("ROLE_USER")))
        );

        var response = controller.getConnectUrl(null);
        assertNotNull(response.getBody());
        Map<String, String> data = response.getBody().data();
        assertNotNull(data);
        String connectUrl = data.get("connectUrl");

        assertTrue(connectUrl.startsWith("http://localhost:8080/oauth2/authorization/google"));
        assertTrue(connectUrl.contains("action=connect_gmail"));
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
