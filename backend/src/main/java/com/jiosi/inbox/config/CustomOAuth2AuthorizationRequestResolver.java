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
 * Ensures the OAuth redirect_uri matches the public frontend domain in production using strict
 * URI origin comparison (scheme, host, effective port) so that session cookies (JSESSIONID)
 * remain first-party and valid across redirects.
 */
public class CustomOAuth2AuthorizationRequestResolver implements OAuth2AuthorizationRequestResolver {

    public static final String GMAIL_READONLY_SCOPE = "https://www.googleapis.com/auth/gmail.readonly";
    public static final String SESSION_GMAIL_CONNECT_ACTION = "JIOSI_GMAIL_CONNECT_ACTION";
    public static final String SESSION_CONNECTING_USER_ID = "JIOSI_CONNECTING_USER_ID";
    public static final String SESSION_CONNECTING_WORKSPACE_ID = "JIOSI_CONNECTING_WORKSPACE_ID";

    private final DefaultOAuth2AuthorizationRequestResolver defaultResolver;
    private final String frontendUrl;
    private final String frontendScheme;
    private final String frontendHost;
    private final int frontendEffectivePort;
    private final boolean isProductionHttps;

    public CustomOAuth2AuthorizationRequestResolver(ClientRegistrationRepository clientRegistrationRepository) {
        this(clientRegistrationRepository, null);
    }

    public CustomOAuth2AuthorizationRequestResolver(ClientRegistrationRepository clientRegistrationRepository, String frontendUrl) {
        this.defaultResolver = new DefaultOAuth2AuthorizationRequestResolver(
                clientRegistrationRepository,
                "/oauth2/authorization"
        );
        this.frontendUrl = frontendUrl != null ? frontendUrl.trim() : null;

        if (this.frontendUrl != null && !this.frontendUrl.isBlank()) {
            URI parsed;
            try {
                parsed = new URI(this.frontendUrl);
            } catch (Exception e) {
                throw new IllegalArgumentException("Malformed frontend URL: " + frontendUrl, e);
            }

            String scheme = parsed.getScheme();
            if (scheme == null || (!"http".equalsIgnoreCase(scheme) && !"https".equalsIgnoreCase(scheme))) {
                throw new IllegalArgumentException("Invalid frontend URL scheme (must be http or https): " + frontendUrl);
            }

            if (parsed.getUserInfo() != null) {
                throw new IllegalArgumentException("Frontend URL must not contain user credentials: " + frontendUrl);
            }

            String host = parsed.getHost();
            if (host == null || host.isBlank()) {
                throw new IllegalArgumentException("Frontend URL must contain a valid host: " + frontendUrl);
            }

            if (parsed.getRawQuery() != null || parsed.getRawFragment() != null) {
                throw new IllegalArgumentException("Frontend URL must not contain query parameters or fragments: " + frontendUrl);
            }

            this.frontendScheme = scheme.toLowerCase();
            this.frontendHost = host.toLowerCase();
            this.frontendEffectivePort = parsed.getPort() != -1
                    ? parsed.getPort()
                    : ("https".equalsIgnoreCase(this.frontendScheme) ? 443 : 80);
            this.isProductionHttps = "https".equalsIgnoreCase(this.frontendScheme);
        } else {
            this.frontendScheme = null;
            this.frontendHost = null;
            this.frontendEffectivePort = -1;
            this.isProductionHttps = false;
        }
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
        if (isProductionHttps && req.getRedirectUri() != null) {
            String currentRedirectUri = req.getRedirectUri();
            try {
                URI currentUri = new URI(currentRedirectUri);
                String currentScheme = currentUri.getScheme() != null ? currentUri.getScheme().toLowerCase() : "";
                String currentHost = currentUri.getHost() != null ? currentUri.getHost().toLowerCase() : "";
                int currentPort = currentUri.getPort() != -1
                        ? currentUri.getPort()
                        : ("https".equalsIgnoreCase(currentScheme) ? 443 : 80);

                boolean originMatches = frontendScheme.equals(currentScheme)
                        && frontendHost.equals(currentHost)
                        && frontendEffectivePort == currentPort;

                if (!originMatches) {
                    // Extract and sanitize path - ensure it's a valid OAuth callback path
                    String rawPath = currentUri.getRawPath();
                    String safePath = (rawPath != null && rawPath.startsWith("/login/oauth2/code/"))
                            ? rawPath
                            : "/login/oauth2/code/" + req.getAttribute("registration_id");

                    if (safePath == null || !safePath.startsWith("/login/oauth2/code/")) {
                        safePath = "/login/oauth2/code/google";
                    }

                    StringBuilder aligned = new StringBuilder();
                    aligned.append(frontendScheme).append("://").append(frontendHost);
                    if ((frontendEffectivePort != 443 && "https".equals(frontendScheme))
                            || (frontendEffectivePort != 80 && "http".equals(frontendScheme))) {
                        aligned.append(":").append(frontendEffectivePort);
                    }
                    aligned.append(safePath);

                    builder.redirectUri(aligned.toString());
                }
            } catch (Exception e) {
                // If URI parsing fails, fail closed in production by forcing safe frontend callback
                builder.redirectUri(frontendScheme + "://" + frontendHost + "/login/oauth2/code/google");
            }
        }

        String action = request.getParameter("action");
        String scopeParam = request.getParameter("scope");

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

            // SECURITY HARDENING: Never read user_id or workspace_id from query parameters.
            // Pending Gmail linking must only be bound to authenticated server-side principal sessions
            // created via authenticated endpoints like GmailController.getConnectUrl.

            builder.scopes(scopes).additionalParameters(additionalParams);
        }

        return builder.build();
    }
}
