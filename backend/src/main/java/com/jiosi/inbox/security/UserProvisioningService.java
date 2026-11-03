package com.jiosi.inbox.security;

import com.jiosi.inbox.common.UnauthorizedException;
import com.jiosi.inbox.user.User;
import com.jiosi.inbox.user.UserRepository;
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
public class UserProvisioningService {

    private static final Logger log = LoggerFactory.getLogger(UserProvisioningService.class);

    private final UserRepository userRepository;
    private final WorkspaceRepository workspaceRepository;
    private final WorkspaceMemberRepository workspaceMemberRepository;

    public UserProvisioningService(
            UserRepository userRepository,
            WorkspaceRepository workspaceRepository,
            WorkspaceMemberRepository workspaceMemberRepository
    ) {
        this.userRepository = userRepository;
        this.workspaceRepository = workspaceRepository;
        this.workspaceMemberRepository = workspaceMemberRepository;
    }

    @Transactional
    public User linkOrCreateGoogleUser(GoogleIdentity identity) {
        if (!identity.emailVerified()) {
            log.warn("Attempt to link/create user with unverified email: {}", identity.email());
            throw new UnauthorizedException("Google email must be verified to authenticate");
        }

        String googleSubject = identity.subject();
        String email = identity.email().trim().toLowerCase();

        // 1. Direct Google Subject Lookup
        Optional<User> bySubject = userRepository.findByGoogleSubject(googleSubject);
        if (bySubject.isPresent()) {
            User existing = bySubject.get();
            // Update profile metadata if changed
            boolean updated = false;
            if (identity.fullName() != null && !identity.fullName().isBlank() && !identity.fullName().equals(existing.getFullName())) {
                existing.setFullName(identity.fullName());
                updated = true;
            }
            if (identity.avatarUrl() != null && !identity.avatarUrl().equals(existing.getAvatarUrl())) {
                existing.setAvatarUrl(identity.avatarUrl());
                updated = true;
            }
            if (updated) {
                return userRepository.save(existing);
            }
            return existing;
        }

        // 2. Safe Account Linking via Verified Email
        Optional<User> byEmail = userRepository.findByEmail(email);
        if (byEmail.isPresent()) {
            User existing = byEmail.get();

            // Collision Check: Does this existing user already have a different Google Subject?
            if (existing.getGoogleSubject() != null && !existing.getGoogleSubject().isBlank()) {
                log.error("Identity collision: Email {} already bound to Google subject {}, cannot rebind to {}",
                        email, existing.getGoogleSubject(), googleSubject);
                throw new UnauthorizedException("Account already linked to a different Google account");
            }

            // Link Google Subject to verified account
            log.info("Linking Google subject {} to existing verified email {}", googleSubject, email);
            existing.setGoogleSubject(googleSubject);
            existing.setEmailVerified(true);
            existing.setAuthProvider("GOOGLE");
            if (identity.fullName() != null && !identity.fullName().isBlank()) {
                existing.setFullName(identity.fullName());
            }
            if (identity.avatarUrl() != null && !identity.avatarUrl().isBlank()) {
                existing.setAvatarUrl(identity.avatarUrl());
            }
            return userRepository.save(existing);
        }

        // 3. New User Provisioning & Default Workspace Creation
        log.info("Provisioning new user with Google identity for email {}", email);
        User newUser = new User(
                email,
                identity.fullName() != null && !identity.fullName().isBlank() ? identity.fullName() : email,
                identity.avatarUrl()
        );
        newUser.setGoogleSubject(googleSubject);
        newUser.setEmailVerified(true);
        newUser.setAuthProvider("GOOGLE");
        newUser = userRepository.save(newUser);

        // Provision Default Personal Workspace
        String wsName = newUser.getFullName() + "'s Workspace";
        String wsSlug = "ws-" + UUID.randomUUID().toString().substring(0, 8);
        Workspace defaultWorkspace = workspaceRepository.save(new Workspace(wsName, wsSlug, newUser));

        // Provision Owner Workspace Membership
        workspaceMemberRepository.save(new WorkspaceMember(defaultWorkspace, newUser, "OWNER"));

        log.info("Successfully provisioned user {} ({}) with default workspace {} ({})",
                newUser.getEmail(), newUser.getId(), defaultWorkspace.getName(), defaultWorkspace.getId());

        return newUser;
    }
}

