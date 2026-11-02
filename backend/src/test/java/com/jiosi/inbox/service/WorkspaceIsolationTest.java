package com.jiosi.inbox.service;

import com.jiosi.inbox.common.ResourceNotFoundException;
import com.jiosi.inbox.email.*;
import com.jiosi.inbox.email.dto.PagedThreadsResponse;
import com.jiosi.inbox.user.User;
import com.jiosi.inbox.user.UserRepository;
import com.jiosi.inbox.workspace.Workspace;
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
class WorkspaceIsolationTest {

    @Autowired
    private EmailThreadService threadService;

    @Autowired
    private EmailDraftService draftService;

    @Autowired
    private EmailThreadRepository threadRepository;

    @Autowired
    private EmailDraftRepository draftRepository;

    @Autowired
    private WorkspaceRepository workspaceRepository;

    @Autowired
    private UserRepository userRepository;

    private Workspace workspaceA;
    private Workspace workspaceB;
    private EmailThread threadA;
    private EmailThread threadB;
    private EmailDraft draftB;

    @BeforeEach
    void setUp() {
        User userA = userRepository.save(new User("ownerA@jiosi.online", "Owner A", "OA"));
        User userB = userRepository.save(new User("ownerB@jiosi.online", "Owner B", "OB"));

        workspaceA = workspaceRepository.save(new Workspace("Workspace Alpha", "ws-alpha-" + UUID.randomUUID(), userA));
        workspaceB = workspaceRepository.save(new Workspace("Workspace Beta", "ws-beta-" + UUID.randomUUID(), userB));

        // Create Thread in Workspace A
        threadA = new EmailThread();
        threadA.setWorkspace(workspaceA);
        threadA.setSubject("Alpha Confidential Strategy");
        threadA.setSnippet("Internal Alpha metrics...");
        threadA.setSenderName("Alice Alpha");
        threadA.setSenderEmail("alice@alpha.com");
        threadA.setRecipientEmail("ownerA@jiosi.online");
        threadA = threadRepository.save(threadA);

        // Create Thread in Workspace B
        threadB = new EmailThread();
        threadB.setWorkspace(workspaceB);
        threadB.setSubject("Beta Confidential Acquisition");
        threadB.setSnippet("Internal Beta metrics...");
        threadB.setSenderName("Bob Beta");
        threadB.setSenderEmail("bob@beta.com");
        threadB.setRecipientEmail("ownerB@jiosi.online");
        threadB = threadRepository.save(threadB);

        // Create Draft in Workspace B
        draftB = draftRepository.save(new EmailDraft(
                workspaceB,
                "partner@beta.com",
                "Beta Partner",
                "Beta Private Offer",
                "Draft content for beta"
        ));
    }

    @Test
    void testWorkspaceA_CannotSeeWorkspaceB_ThreadsInList() {
        PagedThreadsResponse responseA = threadService.getThreads(workspaceA.getId(), "inbox", "all", 0, 20);
        assertEquals(1, responseA.threads().size());
        assertEquals("Alpha Confidential Strategy", responseA.threads().get(0).subject());
        assertFalse(responseA.threads().stream().anyMatch(t -> t.id().equals(threadB.getId().toString())));

        PagedThreadsResponse responseB = threadService.getThreads(workspaceB.getId(), "inbox", "all", 0, 20);
        assertEquals(1, responseB.threads().size());
        assertEquals("Beta Confidential Acquisition", responseB.threads().get(0).subject());
        assertFalse(responseB.threads().stream().anyMatch(t -> t.id().equals(threadA.getId().toString())));
    }

    @Test
    void testWorkspaceA_CannotAccessWorkspaceB_ThreadDetail() {
        // Workspace A querying thread B must throw ResourceNotFoundException
        assertThrows(ResourceNotFoundException.class, () -> {
            threadService.getThreadDetail(workspaceA.getId(), threadB.getId());
        });
    }

    @Test
    void testWorkspaceA_CannotMutateWorkspaceB_ThreadState() {
        // Workspace A attempting to star, archive, or read thread B must throw ResourceNotFoundException
        assertThrows(ResourceNotFoundException.class, () -> {
            threadService.updateStar(workspaceA.getId(), threadB.getId(), true);
        });

        assertThrows(ResourceNotFoundException.class, () -> {
            threadService.updateArchive(workspaceA.getId(), threadB.getId(), true);
        });

        assertThrows(ResourceNotFoundException.class, () -> {
            threadService.updateRead(workspaceA.getId(), threadB.getId(), false);
        });
    }

    @Test
    void testWorkspaceA_CannotAccessOrDeleteWorkspaceB_Drafts() {
        assertThrows(ResourceNotFoundException.class, () -> {
            draftService.getDraft(workspaceA.getId(), draftB.getId());
        });

        assertThrows(ResourceNotFoundException.class, () -> {
            draftService.deleteDraft(workspaceA.getId(), draftB.getId());
        });
    }
}
