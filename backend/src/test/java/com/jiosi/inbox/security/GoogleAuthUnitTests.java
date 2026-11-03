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
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
class GoogleAuthUnitTests {

    @Autowired
    private UserProvisioningService provisioningService;

    @Autowired
    private WorkspaceAuthorizationService workspaceAuthService;

    @Autowired
    private AuthTokenService authTokenService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private WorkspaceRepository workspaceRepository;

    @Autowired
    private WorkspaceMemberRepository workspaceMemberRepository;

    private User existingUser;
    private Workspace workspace;

    @BeforeEach
    void setUp() {
        existingUser = new User("existing." + UUID.randomUUID() + "@jiosi.online", "Existing User", null);
        existingUser = userRepository.save(existingUser);

        workspace = workspaceRepository.save(new Workspace("Test WS", "test-ws-" + UUID.randomUUID(), existingUser));
        workspaceMemberRepository.save(new WorkspaceMember(workspace, existingUser, "OWNER"));
    }

    @Test
    void testProvisioning_NewUser_CreatesUserAndDefaultWorkspace() {
        String sub = "google-sub-" + UUID.randomUUID();
        String email = "brand.new." + UUID.randomUUID() + "@jiosi.online";
        GoogleIdentity identity = new GoogleIdentity(sub, email, true, "New Google User", "https://avatar.url");

        User created = provisioningService.linkOrCreateGoogleUser(identity);

        assertNotNull(created.getId());
        assertEquals(email, created.getEmail());
        assertEquals(sub, created.getGoogleSubject());
        assertTrue(created.isEmailVerified());
        assertEquals("GOOGLE", created.getAuthProvider());

        // Verify default workspace was created
        var memberships = workspaceMemberRepository.findByUserId(created.getId());
        assertEquals(1, memberships.size());
        assertEquals("OWNER", memberships.get(0).getRole());
        assertTrue(memberships.get(0).getWorkspace().getName().contains("New Google User"));
    }

    @Test
    void testProvisioning_ExistingUserWithoutSubject_LinksSubject() {
        String sub = "google-sub-" + UUID.randomUUID();
        GoogleIdentity identity = new GoogleIdentity(sub, existingUser.getEmail(), true, "Existing Updated", null);

        User linked = provisioningService.linkOrCreateGoogleUser(identity);

        assertEquals(existingUser.getId(), linked.getId());
        assertEquals(sub, linked.getGoogleSubject());
        assertTrue(linked.isEmailVerified());
        assertEquals("GOOGLE", linked.getAuthProvider());
    }

    @Test
    void testProvisioning_ExistingUserSameSubject_IdempotentUpdate() {
        String sub = "google-sub-fixed-123";
        existingUser.setGoogleSubject(sub);
        existingUser.setEmailVerified(true);
        userRepository.save(existingUser);

        GoogleIdentity identity = new GoogleIdentity(sub, existingUser.getEmail(), true, "Renamed Name", "https://new-avatar.png");
        User updated = provisioningService.linkOrCreateGoogleUser(identity);

        assertEquals(existingUser.getId(), updated.getId());
        assertEquals("Renamed Name", updated.getFullName());
        assertEquals("https://new-avatar.png", updated.getAvatarUrl());
    }

    @Test
    void testProvisioning_IdentityCollision_ThrowsUnauthorized() {
        existingUser.setGoogleSubject("original-google-sub-111");
        existingUser.setEmailVerified(true);
        userRepository.save(existingUser);

        // Attacker attempts to bind different Google subject to existingUser's email
        GoogleIdentity conflicting = new GoogleIdentity("attacker-google-sub-222", existingUser.getEmail(), true, "Attacker", null);

        assertThrows(UnauthorizedException.class, () -> provisioningService.linkOrCreateGoogleUser(conflicting));
    }

    @Test
    void testProvisioning_UnverifiedEmail_ThrowsUnauthorized() {
        GoogleIdentity unverified = new GoogleIdentity("sub-unverified", "unverified@jiosi.online", false, "Unverified", null);
        assertThrows(UnauthorizedException.class, () -> provisioningService.linkOrCreateGoogleUser(unverified));
    }

    @Test
    void testWorkspaceAuth_Owner_AccessGranted() {
        var access = workspaceAuthService.validateAccess(workspace.getId(), existingUser);
        assertNotNull(access);
        assertEquals("OWNER", access.role());
        assertEquals(workspace.getId(), access.workspace().getId());
    }

    @Test
    void testWorkspaceAuth_Member_AccessGranted() {
        User memberUser = userRepository.save(new User("member." + UUID.randomUUID() + "@jiosi.online", "Member User", null));
        workspaceMemberRepository.save(new WorkspaceMember(workspace, memberUser, "MEMBER"));

        var access = workspaceAuthService.validateAccess(workspace.getId(), memberUser);
        assertNotNull(access);
        assertEquals("MEMBER", access.role());
    }

    @Test
    void testWorkspaceAuth_NonMember_AccessDenied() {
        User nonMember = userRepository.save(new User("nonmember." + UUID.randomUUID() + "@jiosi.online", "Non Member", null));

        assertThrows(WorkspaceAccessDeniedException.class, () ->
                workspaceAuthService.validateAccess(workspace.getId(), nonMember));
    }

    @Test
    void testWorkspaceAuth_NonExistentWorkspace_ThrowsNotFound() {
        UUID fakeWorkspaceId = UUID.randomUUID();
        assertThrows(ResourceNotFoundException.class, () ->
                workspaceAuthService.validateAccess(fakeWorkspaceId, existingUser));
    }

    @Test
    void testWorkspaceAuth_NullUser_ThrowsUnauthorized() {
        assertThrows(UnauthorizedException.class, () ->
                workspaceAuthService.validateAccess(workspace.getId(), null));
    }

    @Test
    void testWorkspaceAuth_NullWorkspaceId_ThrowsIllegalArgument() {
        assertThrows(IllegalArgumentException.class, () ->
                workspaceAuthService.validateAccess(null, existingUser));
    }

    @Test
    void testAuthTokenService_TamperedSignature_ThrowsUnauthorized() {
        String token = authTokenService.generateToken(existingUser);
        String tampered = token.substring(0, token.length() - 5) + "ABCDE";

        assertThrows(UnauthorizedException.class, () ->
                authTokenService.validateAndExtractUserId("Bearer " + tampered));
    }

    @Test
    void testAuthTokenService_DevTokenPrefix_ThrowsUnauthorized() {
        // dev-token must no longer be accepted
        assertThrows(UnauthorizedException.class, () ->
                authTokenService.validateAndExtractUserId("Bearer dev-token-" + existingUser.getId()));
    }
}

