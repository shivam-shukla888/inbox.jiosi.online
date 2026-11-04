package com.jiosi.inbox.security;

import com.jiosi.inbox.common.ResourceNotFoundException;
import com.jiosi.inbox.common.UnauthorizedException;
import com.jiosi.inbox.common.WorkspaceAccessDeniedException;
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
    private final WorkspaceAuthorizationService workspaceAuthorizationService;
    private final String frontendUrl;

    public OAuth2AuthenticationSuccessHandler(
            UserProvisioningService userProvisioningService,
            UserRepository userRepository,
            OAuth2AuthorizedClientService authorizedClientService,
            ConnectedAccountRepository connectedAccountRepository,
            TokenEncryptionService tokenEncryptionService,
            WorkspaceRepository workspaceRepository,
            WorkspaceMemberRepository workspaceMemberRepository,
            WorkspaceAuthorizationService workspaceAuthorizationService,
            @Value("${app.frontend-url:http://localhost:5173}") String frontendUrl
    ) {
        this.userProvisioningService = userProvisioningService;
        this.userRepository = userRepository;
        this.authorizedClientService = authorizedClientService;
        this.connectedAccountRepository = connectedAccountRepository;
        this.tokenEncryptionService = tokenEncryptionService;
        this.workspaceRepository = workspaceRepository;
        this.workspaceMemberRepository = workspaceMemberRepository;
        this.workspaceAuthorizationService = workspaceAuthorizationService;
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

        if (email == null || email.isBlank()) {
            log.error("OAuth2 authentication succeeded but email claim is missing");
            response.sendRedirect(frontendUrl + "/?auth_error=" + URLEncoder.encode("Email missing from OAuth provider", StandardCharsets.UTF_8));
            return;
        }

        if (!emailVerified) {
            log.warn("OAuth2 login rejected for unverified email: {}", email);
            response.sendRedirect(frontendUrl + "/?auth_error=" + URLEncoder.encode("Google email address is not verified", StandardCharsets.UTF_8));
            return;
        }

        // Provision or sync user in database
        GoogleIdentity identity = new GoogleIdentity(
                subject,
                email,
                emailVerified,
                name != null ? name : email,
                picture
        );
        User user = userProvisioningService.linkOrCreateGoogleUser(identity);

        // Bind application User principal to SecurityContext and session
        UsernamePasswordAuthenticationToken appAuth = new UsernamePasswordAuthenticationToken(
                user,
                null,
                List.of(new SimpleGrantedAuthority("ROLE_USER"))
        );
        SecurityContext context = SecurityContextHolder.createEmptyContext();
        context.setAuthentication(appAuth);
        SecurityContextHolder.setContext(context);

        HttpSession session = request.getSession(true);
        session.setAttribute(HttpSessionSecurityContextRepository.SPRING_SECURITY_CONTEXT_KEY, context);

        boolean isGmailAction = Boolean.TRUE.equals(
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
        String connectingUserIdParam = null;
        String connectingWsIdParam = null;

        if (session != null) {
            connectingUserIdParam = (String) session.getAttribute(CustomOAuth2AuthorizationRequestResolver.SESSION_CONNECTING_USER_ID);
            connectingWsIdParam = (String) session.getAttribute(CustomOAuth2AuthorizationRequestResolver.SESSION_CONNECTING_WORKSPACE_ID);

            // Cleanup session flags immediately so they cannot be reused
            session.removeAttribute(CustomOAuth2AuthorizationRequestResolver.SESSION_GMAIL_CONNECT_ACTION);
            session.removeAttribute(CustomOAuth2AuthorizationRequestResolver.SESSION_CONNECTING_USER_ID);
            session.removeAttribute(CustomOAuth2AuthorizationRequestResolver.SESSION_CONNECTING_WORKSPACE_ID);
        }

        // SECURITY CHECK 1: Ensure Gmail linking was initiated by an authenticated server-side principal session
        if (connectingUserIdParam == null || connectingUserIdParam.isBlank()) {
            log.warn("Gmail linking rejected: no authenticated server-side principal in session");
            response.sendRedirect(frontendUrl + "/?auth_error=" + URLEncoder.encode("Gmail linking requires an active authenticated session", StandardCharsets.UTF_8));
            return;
        }

        UUID connectingUserId;
        try {
            connectingUserId = UUID.fromString(connectingUserIdParam.trim());
        } catch (IllegalArgumentException e) {
            log.warn("Gmail linking rejected: invalid user ID format in session: {}", connectingUserIdParam);
            response.sendRedirect(frontendUrl + "/?auth_error=" + URLEncoder.encode("Invalid session user ID", StandardCharsets.UTF_8));
            return;
        }

        User targetUser = userRepository.findById(connectingUserId).orElse(null);
        if (targetUser == null) {
            log.warn("Gmail linking rejected: user {} not found", connectingUserId);
            response.sendRedirect(frontendUrl + "/?auth_error=" + URLEncoder.encode("User not found", StandardCharsets.UTF_8));
            return;
        }

        // SECURITY CHECK 2: Validate workspace membership immediately before saving
        Workspace targetWorkspace = null;
        if (connectingWsIdParam != null && !connectingWsIdParam.isBlank()) {
            try {
                UUID wsId = UUID.fromString(connectingWsIdParam.trim());
                WorkspaceAuthorizationService.WorkspaceMemberAccess access = workspaceAuthorizationService.validateAccess(wsId, targetUser);
                targetWorkspace = access.workspace();
            } catch (WorkspaceAccessDeniedException ex) {
                log.warn("Unauthorized workspace Gmail linking attempt: User {} ({}) attempted access to workspace {}",
                        targetUser.getEmail(), targetUser.getId(), connectingWsIdParam);
                response.sendRedirect(frontendUrl + "/?auth_error=" + URLEncoder.encode("Access denied to workspace", StandardCharsets.UTF_8));
                return;
            } catch (ResourceNotFoundException ex) {
                log.warn("Workspace not found for Gmail linking: {}", connectingWsIdParam);
                response.sendRedirect(frontendUrl + "/?auth_error=" + URLEncoder.encode("Workspace not found", StandardCharsets.UTF_8));
                return;
            } catch (IllegalArgumentException ex) {
                log.warn("Invalid workspace ID in session: {}", connectingWsIdParam);
                response.sendRedirect(frontendUrl + "/?auth_error=" + URLEncoder.encode("Invalid workspace ID", StandardCharsets.UTF_8));
                return;
            }
        } else {
            targetWorkspace = resolveUserDefaultWorkspace(targetUser);
            if (targetWorkspace != null) {
                try {
                    workspaceAuthorizationService.validateAccess(targetWorkspace.getId(), targetUser);
                } catch (Exception ex) {
                    log.warn("Default workspace validation failed for user {}: {}", targetUser.getId(), ex.getMessage());
                    response.sendRedirect(frontendUrl + "/?auth_error=" + URLEncoder.encode("Workspace access validation failed", StandardCharsets.UTF_8));
                    return;
                }
            }
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
