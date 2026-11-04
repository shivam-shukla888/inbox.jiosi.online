package com.jiosi.inbox.security;

import com.jiosi.inbox.common.UnauthorizedException;
import com.jiosi.inbox.config.CustomOAuth2AuthorizationRequestResolver;
import com.jiosi.inbox.connectedaccount.ConnectedAccount;
import com.jiosi.inbox.connectedaccount.ConnectedAccountRepository;
import com.jiosi.inbox.user.User;
import com.jiosi.inbox.user.UserRepository;
import com.jiosi.inbox.workspace.Workspace;
import com.jiosi.inbox.workspace.WorkspaceMember;
import com.jiosi.inbox.workspace.WorkspaceMemberRepository;
import com.jiosi.inbox.workspace.WorkspaceRepository;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.client.OAuth2AuthorizedClient;
import org.springframework.security.oauth2.client.OAuth2AuthorizedClientService;
import org.springframework.security.oauth2.client.authentication.OAuth2AuthenticationToken;
import org.springframework.security.oauth2.core.oidc.user.OidcUser;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
import org.springframework.security.web.context.HttpSessionSecurityContextRepository;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Component
public class OAuth2AuthenticationSuccessHandler implements AuthenticationSuccessHandler {

    private static final Logger log = LoggerFactory.getLogger(OAuth2AuthenticationSuccessHandler.class);

    private final UserProvisioningService userProvisioningService;
    private final UserRepository userRepository;
    private final OAuth2AuthorizedClientService authorizedClientService;
    private final ConnectedAccountRepository connectedAccountRepository;
    private final TokenEncryptionService tokenEncryptionService;
    private final WorkspaceRepository workspaceRepository;
    private final WorkspaceMemberRepository workspaceMemberRepository;
    private final String frontendUrl;

    public OAuth2AuthenticationSuccessHandler(
            UserProvisioningService userProvisioningService,
            UserRepository userRepository,
            OAuth2AuthorizedClientService authorizedClientService,
            ConnectedAccountRepository connectedAccountRepository,
            TokenEncryptionService tokenEncryptionService,
            WorkspaceRepository workspaceRepository,
            WorkspaceMemberRepository workspaceMemberRepository,
            @Value("${app.frontend-url:http://localhost:5173}") String frontendUrl
    ) {
        this.userProvisioningService = userProvisioningService;
        this.userRepository = userRepository;
        this.authorizedClientService = authorizedClientService;
        this.connectedAccountRepository = connectedAccountRepository;
        this.tokenEncryptionService = tokenEncryptionService;
        this.workspaceRepository = workspaceRepository;
        this.workspaceMemberRepository = workspaceMemberRepository;
        this.frontendUrl = frontendUrl.endsWith("/") ? frontendUrl.substring(0, frontendUrl.length() - 1) : frontendUrl;
    }

    @Override
    @Transactional
    public void onAuthenticationSuccess(
            HttpServletRequest request,
            HttpServletResponse response,
            Authentication authentication
    ) throws IOException, ServletException {

        Object principal = authentication.getPrincipal();
        String subject = null;
        String email = null;
        boolean emailVerified = false;
        String name = null;
        String picture = null;

        if (principal instanceof OidcUser oidcUser) {
            subject = oidcUser.getSubject();
            email = oidcUser.getEmail();
            emailVerified = Boolean.TRUE.equals(oidcUser.getEmailVerified());
            name = oidcUser.getFullName();
            picture = oidcUser.getPicture();
        } else if (principal instanceof OAuth2User oauth2User) {
            subject = oauth2User.getName();
            email = (String) oauth2User.getAttributes().get("email");
            emailVerified = Boolean.TRUE.equals(oauth2User.getAttributes().get("email_verified"));
            name = (String) oauth2User.getAttributes().get("name");
            picture = (String) oauth2User.getAttributes().get("picture");
        }

        if (subject == null || email == null) {
            log.error("OAuth2 user missing subject or email. Principal attributes: {}", principal);
            throw new UnauthorizedException("Google user missing required subject or email claims");
        }

        if (!emailVerified) {
            log.warn("OAuth2 Google user email is not verified: {}", email);
            throw new UnauthorizedException("Google account email is not verified");
        }

        GoogleIdentity identity = new GoogleIdentity(
                subject,
                email,
                true,
                name != null ? name : email,
                picture
        );

        User user = userProvisioningService.linkOrCreateGoogleUser(identity);

        // Bind user entity to SecurityContext
        UsernamePasswordAuthenticationToken appAuth = new UsernamePasswordAuthenticationToken(
                user,
                null,
                List.of(new SimpleGrantedAuthority("ROLE_USER"))
        );
        SecurityContext context = SecurityContextHolder.createEmptyContext();
        context.setAuthentication(appAuth);
        SecurityContextHolder.setContext(context);
        request.getSession().setAttribute(
                HttpSessionSecurityContextRepository.SPRING_SECURITY_CONTEXT_KEY,
                context
        );

        // Check if this flow is a Gmail connection action
        HttpSession session = request.getSession(false);
        boolean isGmailAction = session != null && Boolean.TRUE.equals(
                session.getAttribute(CustomOAuth2AuthorizationRequestResolver.SESSION_GMAIL_CONNECT_ACTION)
        );

        OAuth2AuthorizedClient authorizedClient = null;
        if (authentication instanceof OAuth2AuthenticationToken oauthToken) {
            authorizedClient = authorizedClientService.loadAuthorizedClient(
                    oauthToken.getAuthorizedClientRegistrationId(),
                    oauthToken.getName()
            );
        }

        boolean hasGmailScope = authorizedClient != null && authorizedClient.getAccessToken().getScopes().stream()
                .anyMatch(s -> s.contains("gmail"));

        if (isGmailAction || hasGmailScope) {
            handleGmailConnectSuccess(request, response, session, user, authorizedClient, email);
            return;
        }

        log.info("Google OAuth2 login successful for user {} ({})", user.getEmail(), user.getId());
        response.sendRedirect(frontendUrl + "/");
    }

    private void handleGmailConnectSuccess(
            HttpServletRequest request,
            HttpServletResponse response,
            HttpSession session,
            User fallbackUser,
            OAuth2AuthorizedClient authorizedClient,
            String accountEmail
    ) throws IOException {
        User targetUser = fallbackUser;
        Workspace targetWorkspace = null;

        if (session != null) {
            String userIdParam = (String) session.getAttribute(CustomOAuth2AuthorizationRequestResolver.SESSION_CONNECTING_USER_ID);
            if (userIdParam != null) {
                try {
                    targetUser = userRepository.findById(UUID.fromString(userIdParam)).orElse(fallbackUser);
                } catch (Exception e) {
                    log.debug("Could not resolve connecting user UUID: {}", e.getMessage());
                }
            }

            String wsIdParam = (String) session.getAttribute(CustomOAuth2AuthorizationRequestResolver.SESSION_CONNECTING_WORKSPACE_ID);
            if (wsIdParam != null) {
                try {
                    targetWorkspace = workspaceRepository.findById(UUID.fromString(wsIdParam)).orElse(null);
                } catch (Exception e) {
                    log.debug("Could not resolve connecting workspace UUID: {}", e.getMessage());
                }
            }

            // Cleanup session flags
            session.removeAttribute(CustomOAuth2AuthorizationRequestResolver.SESSION_GMAIL_CONNECT_ACTION);
            session.removeAttribute(CustomOAuth2AuthorizationRequestResolver.SESSION_CONNECTING_USER_ID);
            session.removeAttribute(CustomOAuth2AuthorizationRequestResolver.SESSION_CONNECTING_WORKSPACE_ID);
        }

        if (targetWorkspace == null) {
            targetWorkspace = resolveUserDefaultWorkspace(targetUser);
        }

        String rawAccessToken = authorizedClient != null ? authorizedClient.getAccessToken().getTokenValue() : null;
        String rawRefreshToken = (authorizedClient != null && authorizedClient.getRefreshToken() != null)
                ? authorizedClient.getRefreshToken().getTokenValue()
                : null;
        Instant expiresAt = authorizedClient != null ? authorizedClient.getAccessToken().getExpiresAt() : null;
        String scope = (authorizedClient != null && !authorizedClient.getAccessToken().getScopes().isEmpty())
                ? String.join(" ", authorizedClient.getAccessToken().getScopes())
                : CustomOAuth2AuthorizationRequestResolver.GMAIL_READONLY_SCOPE;

        // Encrypt tokens at rest using AES-256-GCM
        String encAccessToken = tokenEncryptionService.encrypt(rawAccessToken);
        String encRefreshToken = rawRefreshToken != null ? tokenEncryptionService.encrypt(rawRefreshToken) : null;

        final User finalTargetUser = targetUser;
        final Workspace finalTargetWorkspace = targetWorkspace;

        ConnectedAccount account = connectedAccountRepository
                .findByUserIdAndProviderAndEmailAddress(finalTargetUser.getId(), "gmail", accountEmail)
                .orElseGet(() -> new ConnectedAccount(finalTargetUser, "gmail", accountEmail, "CONNECTED"));

        account.setUser(finalTargetUser);
        account.setWorkspace(finalTargetWorkspace);
        account.setStatus("CONNECTED");
        account.setAccessTokenEncrypted(encAccessToken);
        if (encRefreshToken != null) {
            account.setRefreshTokenEncrypted(encRefreshToken);
        }
        account.setTokenExpiresAt(expiresAt);
        account.setScope(scope);
        account.setLastSyncAt(Instant.now());
        connectedAccountRepository.save(account);

        log.info("Gmail account {} securely connected for user {} in workspace {}",
                accountEmail, finalTargetUser.getEmail(), finalTargetWorkspace != null ? finalTargetWorkspace.getId() : "none");

        response.sendRedirect(frontendUrl + "/?gmail_connected=true&email=" + URLEncoder.encode(accountEmail, StandardCharsets.UTF_8));
    }

    private Workspace resolveUserDefaultWorkspace(User user) {
        List<WorkspaceMember> memberships = workspaceMemberRepository.findByUserId(user.getId());
        if (!memberships.isEmpty() && memberships.get(0).getWorkspace() != null) {
            return memberships.get(0).getWorkspace();
        }
        return workspaceRepository.findAll().stream()
                .filter(w -> w.getOwner() != null && w.getOwner().getId().equals(user.getId()))
                .findFirst()
                .orElse(null);
    }
}
