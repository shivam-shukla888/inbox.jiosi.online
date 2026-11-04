package com.jiosi.inbox.security;

import com.jiosi.inbox.common.ApiResponse;
import com.jiosi.inbox.common.UnauthorizedException;
import com.jiosi.inbox.user.User;
import com.jiosi.inbox.workspace.Workspace;
import com.jiosi.inbox.workspace.WorkspaceMember;
import com.jiosi.inbox.workspace.WorkspaceMemberRepository;
import com.jiosi.inbox.workspace.WorkspaceRepository;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.context.HttpSessionSecurityContextRepository;
import org.springframework.security.web.csrf.CsrfToken;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {

    private final GoogleIdTokenVerifierService googleVerifierService;
    private final UserProvisioningService userProvisioningService;
    private final AuthTokenService authTokenService;
    private final WorkspaceRepository workspaceRepository;
    private final WorkspaceMemberRepository workspaceMemberRepository;

    public AuthController(
            GoogleIdTokenVerifierService googleVerifierService,
            UserProvisioningService userProvisioningService,
            AuthTokenService authTokenService,
            WorkspaceRepository workspaceRepository,
            WorkspaceMemberRepository workspaceMemberRepository
    ) {
        this.googleVerifierService = googleVerifierService;
        this.userProvisioningService = userProvisioningService;
        this.authTokenService = authTokenService;
        this.workspaceRepository = workspaceRepository;
        this.workspaceMemberRepository = workspaceMemberRepository;
    }

    public record GoogleAuthRequest(@NotBlank(message = "idToken must not be blank") String idToken) {}

    public record AuthResponse(
            String token,
            UUID userId,
            String email,
            String fullName,
            String avatarUrl,
            UUID defaultWorkspaceId,
            String defaultWorkspaceName,
            String role
    ) {}

    @PostMapping("/google")
    @Transactional
    public ResponseEntity<ApiResponse<AuthResponse>> authenticateWithGoogle(
            @Valid @RequestBody GoogleAuthRequest request,
            HttpServletRequest servletRequest
    ) {
        // 1. Verify Google ID token cryptographically
        GoogleIdentity identity = googleVerifierService.verify(request.idToken());

        // 2. Link existing user or provision new user with default workspace
        User user = userProvisioningService.linkOrCreateGoogleUser(identity);

        // 3. Establish Spring Security Session
        UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(
                user,
                null,
                List.of(new SimpleGrantedAuthority("ROLE_USER"))
        );
        SecurityContext securityContext = SecurityContextHolder.createEmptyContext();
        securityContext.setAuthentication(authentication);
        SecurityContextHolder.setContext(securityContext);

        HttpSession session = servletRequest.getSession(true);
        session.setAttribute(HttpSessionSecurityContextRepository.SPRING_SECURITY_CONTEXT_KEY, securityContext);

        // 4. Generate Internal Session JWT
        String token = authTokenService.generateToken(user);

        // 5. Resolve Primary Workspace Info
        WorkspaceInfo wsInfo = resolvePrimaryWorkspace(user);

        AuthResponse resp = new AuthResponse(
                token,
                user.getId(),
                user.getEmail(),
                user.getFullName(),
                user.getAvatarUrl(),
                wsInfo.workspaceId(),
                wsInfo.workspaceName(),
                wsInfo.role()
        );

        return ResponseEntity.ok(ApiResponse.ok(resp, "Google authentication successful"));
    }

    @GetMapping("/me")
    @Transactional(readOnly = true)
    public ResponseEntity<ApiResponse<AuthResponse>> getMe() {
        User user = resolveCurrentUser();
        if (user == null) {
            throw new UnauthorizedException("Authentication required: no active session");
        }

        String token = authTokenService.generateToken(user);
        WorkspaceInfo wsInfo = resolvePrimaryWorkspace(user);

        AuthResponse resp = new AuthResponse(
                token,
                user.getId(),
                user.getEmail(),
                user.getFullName(),
                user.getAvatarUrl(),
                wsInfo.workspaceId(),
                wsInfo.workspaceName(),
                wsInfo.role()
        );

        return ResponseEntity.ok(ApiResponse.ok(resp, "Authenticated user profile"));
    }

    @GetMapping("/csrf")
    public ResponseEntity<ApiResponse<Map<String, String>>> getCsrfToken(CsrfToken csrfToken) {
        if (csrfToken == null) {
            return ResponseEntity.ok(ApiResponse.ok(Map.of(), "No CSRF token"));
        }
        return ResponseEntity.ok(ApiResponse.ok(Map.of(
                "token", csrfToken.getToken(),
                "headerName", csrfToken.getHeaderName(),
                "parameterName", csrfToken.getParameterName()
        ), "CSRF token retrieved"));
    }

    private User resolveCurrentUser() {
        User user = UserContext.getUser();
        if (user != null) {
            return user;
        }

        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.isAuthenticated() && auth.getPrincipal() instanceof User userPrincipal) {
            return userPrincipal;
        }

        return null;
    }

    private record WorkspaceInfo(UUID workspaceId, String workspaceName, String role) {}

    private WorkspaceInfo resolvePrimaryWorkspace(User user) {
        List<WorkspaceMember> memberships = workspaceMemberRepository.findByUserId(user.getId());
        UUID defaultWsId = null;
        String defaultWsName = "Primary Workspace";
        String role = "OWNER";

        if (!memberships.isEmpty()) {
            WorkspaceMember member = memberships.get(0);
            UUID wsId = member.getWorkspace() != null ? member.getWorkspace().getId() : null;
            defaultWsId = wsId;
            role = member.getRole();
            if (wsId != null) {
                defaultWsName = workspaceRepository.findById(wsId)
                        .map(Workspace::getName)
                        .orElse("Primary Workspace");
            }
        } else {
            List<Workspace> owned = workspaceRepository.findAll().stream()
                    .filter(w -> w.getOwner() != null && w.getOwner().getId().equals(user.getId()))
                    .toList();
            if (!owned.isEmpty()) {
                defaultWsId = owned.get(0).getId();
                defaultWsName = owned.get(0).getName();
            }
        }

        return new WorkspaceInfo(defaultWsId, defaultWsName, role);
    }
}
