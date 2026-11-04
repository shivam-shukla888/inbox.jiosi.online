package com.jiosi.inbox.config;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import org.springframework.security.oauth2.client.registration.ClientRegistrationRepository;
import org.springframework.security.oauth2.client.web.DefaultOAuth2AuthorizationRequestResolver;
import org.springframework.security.oauth2.client.web.OAuth2AuthorizationRequestResolver;
import org.springframework.security.oauth2.core.endpoint.OAuth2AuthorizationRequest;

import java.net.URI;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.Map;
import java.util.Set;

/**
 * Custom OAuth2 Authorization Request Resolver supporting incremental Gmail API authorization
 * and production reverse-proxy redirect URI alignment.
 *
 * Distinguishes between standard login (openid, profile, email) and Gmail mailbox connection
 * (https://www.googleapis.com/auth/gmail.readonly) with offline access for refresh token issuance.
 *
 * Ensures the OAuth redirect_uri matches the public frontend domain in production so that
 * session cookies (JSESSIONID) remain first-party and valid across redirects.
 */
public class CustomOAuth2AuthorizationRequestResolver implements OAuth2AuthorizationRequestResolver {

    public static final String GMAIL_READONLY_SCOPE = "https://www.googleapis.com/auth/gmail.readonly";
    public static final String SESSION_GMAIL_CONNECT_ACTION = "JIOSI_GMAIL_CONNECT_ACTION";
    public static final String SESSION_CONNECTING_USER_ID = "JIOSI_CONNECTING_USER_ID";
    public static final String SESSION_CONNECTING_WORKSPACE_ID = "JIOSI_CONNECTING_WORKSPACE_ID";

    private final DefaultOAuth2AuthorizationRequestResolver defaultResolver;
    private final String frontendUrl;

    public CustomOAuth2AuthorizationRequestResolver(ClientRegistrationRepository clientRegistrationRepository) {
        this(clientRegistrationRepository, null);
    }

    public CustomOAuth2AuthorizationRequestResolver(ClientRegistrationRepository clientRegistrationRepository, String frontendUrl) {
        this.defaultResolver = new DefaultOAuth2AuthorizationRequestResolver(
                clientRegistrationRepository,
                "/oauth2/authorization"
        );
        this.frontendUrl = frontendUrl != null ? frontendUrl.trim() : null;
    }

    @Override
    public OAuth2AuthorizationRequest resolve(HttpServletRequest request) {
        OAuth2AuthorizationRequest req = defaultResolver.resolve(request);
        return customize(req, request);
    }

    @Override
    public OAuth2AuthorizationRequest resolve(HttpServletRequest request, String clientRegistrationId) {
        OAuth2AuthorizationRequest req = defaultResolver.resolve(request, clientRegistrationId);
        return customize(req, request);
    }

    private OAuth2AuthorizationRequest customize(OAuth2AuthorizationRequest req, HttpServletRequest request) {
        if (req == null) {
            return null;
        }

        OAuth2AuthorizationRequest.Builder builder = OAuth2AuthorizationRequest.from(req);

        // Align redirectUri to public frontend domain in production when behind a reverse proxy
        if (frontendUrl != null && !frontendUrl.isBlank()) {
            String currentRedirectUri = req.getRedirectUri();
            // If the frontend is configured as a public HTTPS domain (e.g., https://inbox.jiosi.online)
            // and the generated redirectUri points to an internal/backend host (e.g., onrender.com),
            // align the redirectUri to route through the frontend proxy to keep session cookies first-party
            if (currentRedirectUri != null && frontendUrl.startsWith("https://") && !currentRedirectUri.startsWith(frontendUrl)) {
                String cleanFrontend = frontendUrl.endsWith("/") ? frontendUrl.substring(0, frontendUrl.length() - 1) : frontendUrl;
                try {
                    URI uri = URI.create(currentRedirectUri);
                    String alignedRedirectUri = cleanFrontend + uri.getRawPath();
                    builder.redirectUri(alignedRedirectUri);
                } catch (Exception ignored) {
                    // Fallback to configured redirectUri
                }
            }
        }

        String action = request.getParameter("action");
        String scopeParam = request.getParameter("scope");
        String userIdParam = request.getParameter("user_id");
        String workspaceIdParam = request.getParameter("workspace_id");

        boolean isGmailConnect = "connect_gmail".equalsIgnoreCase(action)
                || (scopeParam != null && scopeParam.contains("gmail"));

        if (isGmailConnect) {
            Set<String> scopes = new LinkedHashSet<>(req.getScopes());
            scopes.add(GMAIL_READONLY_SCOPE);

            Map<String, Object> additionalParams = new LinkedHashMap<>(req.getAdditionalParameters());
            // REQUIRED: Google only returns a refresh_token when access_type=offline and prompt=consent
            additionalParams.put("access_type", "offline");
            additionalParams.put("prompt", "consent");
            additionalParams.put("include_granted_scopes", "true");

            HttpSession session = request.getSession(true);
            session.setAttribute(SESSION_GMAIL_CONNECT_ACTION, Boolean.TRUE);
            if (userIdParam != null && !userIdParam.isBlank()) {
                session.setAttribute(SESSION_CONNECTING_USER_ID, userIdParam.trim());
            }
            if (workspaceIdParam != null && !workspaceIdParam.isBlank()) {
                session.setAttribute(SESSION_CONNECTING_WORKSPACE_ID, workspaceIdParam.trim());
            }

            builder.scopes(scopes).additionalParameters(additionalParams);
        }

        return builder.build();
    }
}
