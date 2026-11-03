package com.jiosi.inbox.security;

import com.jiosi.inbox.common.UnauthorizedException;
import com.jiosi.inbox.user.User;
import com.jiosi.inbox.user.UserRepository;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

import java.util.UUID;

@Component
public class SecurityInterceptor implements HandlerInterceptor {

    private static final Logger log = LoggerFactory.getLogger(SecurityInterceptor.class);

    private final AuthTokenService authTokenService;
    private final UserRepository userRepository;
    private final WorkspaceAuthorizationService workspaceAuthorizationService;

    public SecurityInterceptor(
            AuthTokenService authTokenService,
            UserRepository userRepository,
            WorkspaceAuthorizationService workspaceAuthorizationService
    ) {
        this.authTokenService = authTokenService;
        this.userRepository = userRepository;
        this.workspaceAuthorizationService = workspaceAuthorizationService;
    }

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) {
        if ("OPTIONS".equalsIgnoreCase(request.getMethod())) {
            return true;
        }

        User user = resolveAuthenticatedUser(request);
        if (user == null) {
            // Unauthenticated request; Spring Security filter chain handles rejecting if path is protected
            return true;
        }

        String workspaceHeader = request.getHeader("X-Workspace-Id");
        if (workspaceHeader != null && !workspaceHeader.isBlank()) {
            UUID workspaceId;
            try {
                workspaceId = UUID.fromString(workspaceHeader.trim());
            } catch (IllegalArgumentException e) {
                throw new IllegalArgumentException("Invalid X-Workspace-Id header: must be a valid UUID");
            }

            WorkspaceAuthorizationService.WorkspaceMemberAccess access =
                    workspaceAuthorizationService.validateAccess(workspaceId, user);

            UserContext.set(user, access.role());
        } else {
            UserContext.set(user, "AUTHENTICATED");
        }

        return true;
    }

    private User resolveAuthenticatedUser(HttpServletRequest request) {
        // 1. Check Spring Security Context Holder
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.isAuthenticated() && auth.getPrincipal() instanceof User userPrincipal) {
            return userPrincipal;
        }

        // 2. Check Bearer token in Authorization header
        String authHeader = request.getHeader("Authorization");
        if (authHeader != null && authHeader.trim().startsWith("Bearer ")) {
            try {
                UUID userId = authTokenService.validateAndExtractUserId(authHeader);
                return userRepository.findById(userId).orElse(null);
            } catch (Exception e) {
                log.debug("Bearer token extraction in interceptor: {}", e.getMessage());
            }
        }

        return null;
    }

    @Override
    public void afterCompletion(HttpServletRequest request, HttpServletResponse response, Object handler, Exception ex) {
        UserContext.clear();
    }
}
