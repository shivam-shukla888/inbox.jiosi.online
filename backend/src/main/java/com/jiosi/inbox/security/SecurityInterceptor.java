package com.jiosi.inbox.security;

import com.jiosi.inbox.common.ResourceNotFoundException;
import com.jiosi.inbox.common.UnauthorizedException;
import com.jiosi.inbox.common.WorkspaceAccessDeniedException;
import com.jiosi.inbox.user.User;
import com.jiosi.inbox.user.UserRepository;
import com.jiosi.inbox.workspace.Workspace;
import com.jiosi.inbox.workspace.WorkspaceMember;
import com.jiosi.inbox.workspace.WorkspaceMemberRepository;
import com.jiosi.inbox.workspace.WorkspaceRepository;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

import java.util.Optional;
import java.util.UUID;

@Component
public class SecurityInterceptor implements HandlerInterceptor {

    private static final Logger log = LoggerFactory.getLogger(SecurityInterceptor.class);

    private final AuthTokenService authTokenService;
    private final UserRepository userRepository;
    private final WorkspaceRepository workspaceRepository;
    private final WorkspaceMemberRepository workspaceMemberRepository;

    @Value("${app.security.enabled:true}")
    private boolean securityEnabled;

    public SecurityInterceptor(
            AuthTokenService authTokenService,
            UserRepository userRepository,
            WorkspaceRepository workspaceRepository,
            WorkspaceMemberRepository workspaceMemberRepository
    ) {
        this.authTokenService = authTokenService;
        this.userRepository = userRepository;
        this.workspaceRepository = workspaceRepository;
        this.workspaceMemberRepository = workspaceMemberRepository;
    }

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) {
        if ("OPTIONS".equalsIgnoreCase(request.getMethod())) {
            return true;
        }

        String authHeader = request.getHeader("Authorization");
        String workspaceHeader = request.getHeader("X-Workspace-Id");

        // 1. Authenticate Identity
        if (authHeader == null || authHeader.isBlank()) {
            if (securityEnabled) {
                throw new UnauthorizedException("Authentication required: missing Authorization header");
            }
            return true;
        }

        UUID userId = authTokenService.validateAndExtractUserId(authHeader);
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new UnauthorizedException("Authenticated user not found"));

        // 2. Authorize Workspace Membership if workspace header is present
        if (workspaceHeader != null && !workspaceHeader.isBlank()) {
            UUID workspaceId;
            try {
                workspaceId = UUID.fromString(workspaceHeader.trim());
            } catch (IllegalArgumentException e) {
                // Let controller handle invalid UUID format or reject here
                return true;
            }

            Workspace workspace = workspaceRepository.findById(workspaceId)
                    .orElseThrow(() -> new ResourceNotFoundException("Workspace not found: " + workspaceId));

            boolean isOwner = workspace.getOwner() != null && workspace.getOwner().getId().equals(user.getId());
            Optional<WorkspaceMember> memberOpt = workspaceMemberRepository.findByWorkspaceIdAndUserId(workspaceId, user.getId());

            if (!isOwner && memberOpt.isEmpty()) {
                log.warn("Access denied: User {} ({}) attempted unauthorized access to workspace {}",
                        user.getEmail(), user.getId(), workspaceId);
                throw new WorkspaceAccessDeniedException("Access denied: user is not an authorized member of workspace " + workspaceId);
            }

            String role = isOwner ? "OWNER" : memberOpt.get().getRole();
            UserContext.set(user, role);
        } else {
            UserContext.set(user, "AUTHENTICATED");
        }

        return true;
    }

    @Override
    public void afterCompletion(HttpServletRequest request, HttpServletResponse response, Object handler, Exception ex) {
        UserContext.clear();
    }
}
