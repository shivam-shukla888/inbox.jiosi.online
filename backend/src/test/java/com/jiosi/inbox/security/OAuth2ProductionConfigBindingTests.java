package com.jiosi.inbox.security;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.security.oauth2.client.OAuth2ClientProperties;
import org.springframework.boot.context.properties.bind.Binder;
import org.springframework.boot.env.YamlPropertySourceLoader;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.core.env.MapPropertySource;
import org.springframework.core.env.PropertySource;
import org.springframework.core.env.StandardEnvironment;
import org.springframework.core.io.ClassPathResource;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.security.oauth2.core.endpoint.OAuth2AuthorizationRequest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.net.URI;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.redirectedUrlPattern;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class OAuth2ProductionConfigBindingTests {

    @Autowired
    private MockMvc mockMvc;

    // =========================================================================
    // PRIORITY 3: SPRING CONFIGURATION BINDING TESTS (PROD PROFILE & OVERRIDES)
    // =========================================================================

    @Test
    @DisplayName("Spring Config Binding: application-prod.yml binds production redirect URI default")
    void testProductionProfile_BindsDefaultRedirectUri() throws Exception {
        StandardEnvironment env = new StandardEnvironment();
        YamlPropertySourceLoader loader = new YamlPropertySourceLoader();

        // Load application.yml followed by application-prod.yml (as Spring Boot does when active profile is prod)
        List<PropertySource<?>> baseSources = loader.load("application.yml", new ClassPathResource("application.yml"));
        for (PropertySource<?> ps : baseSources) {
            env.getPropertySources().addLast(ps);
        }

        List<PropertySource<?>> prodSources = loader.load("application-prod.yml", new ClassPathResource("application-prod.yml"));
        for (PropertySource<?> ps : prodSources) {
            env.getPropertySources().addFirst(ps);
        }

        Binder binder = Binder.get(env);
        OAuth2ClientProperties properties = binder.bind("spring.security.oauth2.client", OAuth2ClientProperties.class).get();
        assertNotNull(properties, "OAuth2ClientProperties must bind from configuration");

        OAuth2ClientProperties.Registration google = properties.getRegistration().get("google");
        assertNotNull(google, "Google client registration must be present");
        assertEquals(
                "https://inbox.jiosi.online/login/oauth2/code/{registrationId}",
                google.getRedirectUri(),
                "application-prod.yml must bind Google redirect-uri to inbox.jiosi.online default"
        );
    }

    @Test
    @DisplayName("Spring Config Binding: GOOGLE_REDIRECT_URI environment variable overrides default in production")
    void testProductionProfile_RespectsGoogleRedirectUriEnvOverride() throws Exception {
        StandardEnvironment env = new StandardEnvironment();
        YamlPropertySourceLoader loader = new YamlPropertySourceLoader();

        // Simulate environment variable override GOOGLE_REDIRECT_URI
        env.getPropertySources().addFirst(new MapPropertySource("envOverrides", Map.of(
                "GOOGLE_REDIRECT_URI", "https://custom.jiosi.online/login/oauth2/code/{registrationId}"
        )));

        List<PropertySource<?>> baseSources = loader.load("application.yml", new ClassPathResource("application.yml"));
        for (PropertySource<?> ps : baseSources) {
            env.getPropertySources().addLast(ps);
        }

        List<PropertySource<?>> prodSources = loader.load("application-prod.yml", new ClassPathResource("application-prod.yml"));
        for (PropertySource<?> ps : prodSources) {
            env.getPropertySources().addLast(ps);
        }

        Binder binder = Binder.get(env);
        OAuth2ClientProperties properties = binder.bind("spring.security.oauth2.client", OAuth2ClientProperties.class).get();
        assertNotNull(properties, "OAuth2ClientProperties must bind from configuration");

        OAuth2ClientProperties.Registration google = properties.getRegistration().get("google");
        assertNotNull(google, "Google client registration must be present");
        assertEquals(
                "https://custom.jiosi.online/login/oauth2/code/{registrationId}",
                google.getRedirectUri(),
                "GOOGLE_REDIRECT_URI environment variable must override default redirect URI"
        );
    }

    // =========================================================================
    // PRIORITY 3: SESSION STATE CONTINUITY (INITIATION -> CALLBACK INTEGRATION)
    // NOTE: This test exercises server-side Spring Security session state continuity.
    // Reverse-proxy cookie forwarding (Vercel) must be validated separately on deployed preview.
    // =========================================================================

    @Test
    @DisplayName("Session State Continuity: OAuth initiation sets session state; callback with same session retrieves state")
    void testOAuthInitiationAndCallback_SessionStateContinuity() throws Exception {
        // Step 1: Initiate OAuth request
        MvcResult initResult = mockMvc.perform(get("/oauth2/authorization/google"))
                .andExpect(status().is3xxRedirection())
                .andExpect(redirectedUrlPattern("https://accounts.google.com/**"))
                .andReturn();

        MockHttpSession session = (MockHttpSession) initResult.getRequest().getSession(false);
        assertNotNull(session, "OAuth initiation must establish an HTTP session");

        // Step 2: Extract authorization request and state from session
        String sessionAttrName = "org.springframework.security.oauth2.client.web.HttpSessionOAuth2AuthorizationRequestRepository.AUTHORIZATION_REQUEST";
        OAuth2AuthorizationRequest authReq = (OAuth2AuthorizationRequest) session.getAttribute(sessionAttrName);
        assertNotNull(authReq, "Session must contain OAuth2AuthorizationRequest");
        String state = authReq.getState();
        assertNotNull(state, "OAuth authorization state must be non-null");

        // Verify initiation redirect URL contained the exact same state parameter
        String locationHeader = initResult.getResponse().getHeader("Location");
        assertNotNull(locationHeader);
        URI locationUri = URI.create(locationHeader);
        assertTrue(locationUri.getQuery().contains("state=" + state), "Authorization URL must contain session state");

        // Step 3: Callback with the SAME session
        // When the callback arrives with the same session, Spring Security finds the matching state.
        // It will fail during token exchange (mock code), NOT due to [authorization_request_not_found]!
        MvcResult callbackResult = mockMvc.perform(get("/login/oauth2/code/google")
                        .param("state", state)
                        .param("code", "mock-authorization-code")
                        .session(session))
                .andExpect(status().is3xxRedirection())
                .andReturn();

        String callbackRedirect = callbackResult.getResponse().getRedirectedUrl();
        assertNotNull(callbackRedirect);
        // Failure is due to token exchange (invalid code with Google), proving state lookup succeeded
        assertFalse(
                callbackRedirect.contains("authorization_request_not_found"),
                "State lookup succeeded: callback must not fail with authorization_request_not_found"
        );

        // Step 4: Contrast with callback WITHOUT session (simulating cross-domain cookie loss)
        // When session cookie is missing, Spring Security cannot find authorization request
        MvcResult lostSessionResult = mockMvc.perform(get("/login/oauth2/code/google")
                        .param("state", state)
                        .param("code", "mock-authorization-code"))
                .andExpect(status().is3xxRedirection())
                .andReturn();

        String lostSessionRedirect = lostSessionResult.getResponse().getRedirectedUrl();
        assertNotNull(lostSessionRedirect);
        assertTrue(
                lostSessionRedirect.contains("auth_error="),
                "Missing session cookie must fail with authentication error"
        );
    }
}
