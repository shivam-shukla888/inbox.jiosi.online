package com.jiosi.inbox.security;

import com.jiosi.inbox.common.UnauthorizedException;
import com.jiosi.inbox.user.User;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.core.oidc.user.OidcUser;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
import org.springframework.security.web.context.HttpSessionSecurityContextRepository;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.util.List;

@Component
public class OAuth2AuthenticationSuccessHandler implements AuthenticationSuccessHandler {

    private static final Logger log = LoggerFactory.getLogger(OAuth2AuthenticationSuccessHandler.class);

    private final UserProvisioningService userProvisioningService;
    private final String frontendUrl;

    public OAuth2AuthenticationSuccessHandler(
            UserProvisioningService userProvisioningService,
            @Value("${app.frontend-url:http://localhost:3000}") String frontendUrl
    ) {
        this.userProvisioningService = userProvisioningService;
        this.frontendUrl = frontendUrl.endsWith("/") ? frontendUrl.substring(0, frontendUrl.length() - 1) : frontendUrl;
    }

    @Override
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

        // Bind our User entity to the SecurityContext
        UsernamePasswordAuthenticationToken appAuth = new UsernamePasswordAuthenticationToken(
                user,
                null,
                List.of(new SimpleGrantedAuthority("ROLE_USER"))
        );

        SecurityContext context = SecurityContextHolder.createEmptyContext();
        context.setAuthentication(appAuth);
        SecurityContextHolder.setContext(context);

        // Persist SecurityContext in HttpSession
        request.getSession().setAttribute(
                HttpSessionSecurityContextRepository.SPRING_SECURITY_CONTEXT_KEY,
                context
        );

        log.info("Google OAuth2 login successful for user {} ({})", user.getEmail(), user.getId());

        // Redirect back to frontend
        response.sendRedirect(frontendUrl + "/");
    }
}
