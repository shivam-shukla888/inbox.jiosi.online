package com.jiosi.inbox.repository;

import com.jiosi.inbox.connectedaccount.ConnectedAccount;
import com.jiosi.inbox.connectedaccount.ConnectedAccountRepository;
import com.jiosi.inbox.user.User;
import com.jiosi.inbox.user.UserRepository;
import com.jiosi.inbox.workspace.Workspace;
import com.jiosi.inbox.workspace.WorkspaceMember;
import com.jiosi.inbox.workspace.WorkspaceMemberRepository;
import com.jiosi.inbox.workspace.WorkspaceRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.test.autoconfigure.orm.jpa.TestEntityManager;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.test.context.ActiveProfiles;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;

@DataJpaTest
@ActiveProfiles("test")
class RepositoryIntegrationTest {

    @Autowired
    private TestEntityManager entityManager;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private WorkspaceRepository workspaceRepository;

    @Autowired
    private WorkspaceMemberRepository workspaceMemberRepository;

    @Autowired
    private ConnectedAccountRepository connectedAccountRepository;

    @Test
    void testUserRepository_SaveAndFindByEmail() {
        User user = new User("qa.tester@jiosi.online", "QA Tester", "https://avatar.test/qa.png");
        User saved = userRepository.save(user);

        assertNotNull(saved.getId());
        Optional<User> found = userRepository.findByEmail("qa.tester@jiosi.online");

        assertTrue(found.isPresent());
        assertEquals("QA Tester", found.get().getFullName());
    }

    @Test
    void testUserRepository_DuplicateEmail_ShouldViolateUniqueConstraint() {
        User user1 = new User("duplicate@jiosi.online", "User 1", null);
        entityManager.persistAndFlush(user1);

        User user2 = new User("duplicate@jiosi.online", "User 2", null);

        assertThrows(DataIntegrityViolationException.class, () -> {
            userRepository.saveAndFlush(user2);
        });
    }

    @Test
    void testWorkspaceAndMembership_SaveAndQuery() {
        User owner = entityManager.persistAndFlush(new User("owner@jiosi.online", "Owner User", null));

        Workspace workspace = new Workspace("Engineering Team", "eng-team", owner);
        Workspace savedWorkspace = workspaceRepository.saveAndFlush(workspace);

        assertNotNull(savedWorkspace.getId());
        Optional<Workspace> foundWorkspace = workspaceRepository.findBySlug("eng-team");
        assertTrue(foundWorkspace.isPresent());

        // Test membership
        WorkspaceMember member = new WorkspaceMember(savedWorkspace, owner, "ADMIN");
        WorkspaceMember savedMember = workspaceMemberRepository.saveAndFlush(member);

        assertNotNull(savedMember.getId());
        assertEquals("ADMIN", savedMember.getRole());
    }

    @Test
    void testConnectedAccountRepository_SaveAndConstraints() {
        User user = entityManager.persistAndFlush(new User("oauth.user@jiosi.online", "OAuth User", null));

        ConnectedAccount account = new ConnectedAccount(user, "gmail", "oauth.user@gmail.com", "ACTIVE");
        ConnectedAccount saved = connectedAccountRepository.saveAndFlush(account);

        assertNotNull(saved.getId());
        assertEquals("gmail", saved.getProvider());

        // Duplicate account for same user, provider, email should violate unique constraint
        ConnectedAccount duplicate = new ConnectedAccount(user, "gmail", "oauth.user@gmail.com", "ACTIVE");
        assertThrows(DataIntegrityViolationException.class, () -> {
            connectedAccountRepository.saveAndFlush(duplicate);
        });
    }
}

