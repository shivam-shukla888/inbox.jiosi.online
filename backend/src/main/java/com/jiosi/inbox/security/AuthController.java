package com.jiosi.inbox.security;

import com.jiosi.inbox.common.ApiResponse;
import com.jiosi.inbox.common.ResourceNotFoundException;
import com.jiosi.inbox.user.User;
import com.jiosi.inbox.user.UserRepository;
import com.jiosi.inbox.workspace.Workspace;
import com.jiosi.inbox.workspace.WorkspaceMember;
import com.jiosi.inbox.workspace.WorkspaceMemberRepository;
import com.jiosi.inbox.workspace.WorkspaceRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {

    private final AuthTokenService authTokenService;
    private final UserRepository userRepository;
    private final WorkspaceRepository workspaceRepository;
    private final WorkspaceMemberRepository workspaceMemberRepository;

    public AuthController(
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

    public record TokenRequest(String email) {}
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

    @PostMapping("/token")
    @Transactional(readOnly = true)
    public ResponseEntity<ApiResponse<AuthResponse>> generateToken(@RequestBody(required = false) TokenRequest request) {
        String email = (request != null && request.email() != null && !request.email().isBlank())
                ? request.email().trim()
                : "alex@jiosi.online";

        User user = userRepository.findByEmail(email)
                .orElseGet(() -> userRepository.findAll().stream().findFirst()
                        .orElseThrow(() -> new ResourceNotFoundException("No users found in system")));

        String token = authTokenService.generateToken(user);

        // Find primary workspace
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

        AuthResponse resp = new AuthResponse(
                token,
                user.getId(),
                user.getEmail(),
                user.getFullName(),
                user.getAvatarUrl(),
                defaultWsId,
                defaultWsName,
                role
        );

        return ResponseEntity.ok(ApiResponse.ok(resp, "Authentication token generated successfully"));
    }

    @GetMapping("/me")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getMe() {
        User user = UserContext.getUser();
        if (user == null) {
            return ResponseEntity.status(401).body(ApiResponse.ok(null, "Unauthenticated"));
        }
        return ResponseEntity.ok(ApiResponse.ok(Map.of(
                "userId", user.getId(),
                "email", user.getEmail(),
                "fullName", user.getFullName(),
                "role", UserContext.getWorkspaceRole() != null ? UserContext.getWorkspaceRole() : "MEMBER"
        ), "User profile retrieved"));
    }
}
