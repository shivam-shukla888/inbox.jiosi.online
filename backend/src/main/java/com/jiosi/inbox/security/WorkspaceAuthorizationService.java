package com.jiosi.inbox.security;

import com.jiosi.inbox.common.ResourceNotFoundException;
import com.jiosi.inbox.common.UnauthorizedException;
import com.jiosi.inbox.common.WorkspaceAccessDeniedException;
import com.jiosi.inbox.user.User;
import com.jiosi.inbox.workspace.Workspace;
import com.jiosi.inbox.workspace.WorkspaceMember;
import com.jiosi.inbox.workspace.WorkspaceMemberRepository;
import com.jiosi.inbox.workspace.WorkspaceRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;
import java.util.UUID;

@Service
public class WorkspaceAuthorizationService {

    private static final Logger log = LoggerFactory.getLogger(WorkspaceAuthorizationService.class);

    private final WorkspaceRepository workspaceRepository;
    private final WorkspaceMemberRepository workspaceMemberRepository;

    public WorkspaceAuthorizationService(
            WorkspaceRepository workspaceRepository,
            WorkspaceMemberRepository workspaceMemberRepository
    ) {
        this.workspaceRepository = workspaceRepository;
        this.workspaceMemberRepository = workspaceMemberRepository;
    }

    @Transactional(readOnly = true)
    public WorkspaceMemberAccess validateAccess(UUID workspaceId, User user) {
        if (user == null) {
            throw new UnauthorizedException("Authentication required to access workspace");
        }
        if (workspaceId == null) {
            throw new IllegalArgumentException("Workspace ID must not be null");
        }

        Workspace workspace = workspaceRepository.findById(workspaceId)
                .orElseThrow(() -> new ResourceNotFoundException("Workspace not found: " + workspaceId));

        boolean isOwner = workspace.getOwner() != null && workspace.getOwner().getId().equals(user.getId());
        Optional<WorkspaceMember> memberOpt = workspaceMemberRepository.findByWorkspaceIdAndUserId(workspaceId, user.getId());

        if (!isOwner && memberOpt.isEmpty()) {
            log.warn("Unauthorized workspace access attempt: User {} ({}) attempted access to Workspace {} ({})",
                    user.getEmail(), user.getId(), workspace.getName(), workspaceId);
            throw new WorkspaceAccessDeniedException("Access denied: user is not an authorized member of workspace " + workspaceId);
        }

        String role = isOwner ? "OWNER" : memberOpt.get().getRole();
        return new WorkspaceMemberAccess(workspace, user, role);
    }

    public record WorkspaceMemberAccess(Workspace workspace, User user, String role) {}
}
