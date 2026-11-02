package com.jiosi.inbox.repository;

import com.jiosi.inbox.connectedaccount.ConnectedAccount;
import com.jiosi.inbox.email.*;
import com.jiosi.inbox.user.User;
import com.jiosi.inbox.workspace.Workspace;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.test.autoconfigure.orm.jpa.TestEntityManager;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.test.context.ActiveProfiles;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

@DataJpaTest
@ActiveProfiles("test")
class EmailDomainRepositoryTest {

    @Autowired
    private TestEntityManager entityManager;

    @Autowired
    private EmailThreadRepository threadRepository;

    @Autowired
    private EmailRepository emailRepository;

    @Autowired
    private EmailDraftRepository draftRepository;

    private Workspace workspace;
    private ConnectedAccount account;

    @BeforeEach
    void setUp() {
        User user = new User("dev.user@jiosi.online", "Dev User", "DU");
        entityManager.persist(user);

        workspace = new Workspace("Test Workspace", "test-ws-" + UUID.randomUUID(), user);
        entityManager.persist(workspace);

        account = new ConnectedAccount(user, "gmail", "dev.user@jiosi.online", "ACTIVE");
        account.setWorkspace(workspace);
        entityManager.persist(account);

        entityManager.flush();
    }

    @Test
    void testSaveAndFindThread_WithTagsAndActionItems() {
        EmailThread thread = new EmailThread();
        thread.setWorkspace(workspace);
        thread.setAccount(account);
        thread.setSubject("Q3 Seed Extension Term Sheet");
        thread.setSnippet("Attached is the revised term sheet...");
        thread.setSenderName("Sarah Jenkins");
        thread.setSenderEmail("sarah@kinto.ventures");
        thread.setRecipientEmail("alex@jiosi.online");
        thread.setUnread(true);
        thread.setStarred(true);
        thread.setNeedsReply(true);
        thread.setTags(new java.util.HashSet<>(Set.of("Fundraising", "VIP")));

        EmailThread saved = threadRepository.save(thread);
        assertNotNull(saved.getId());

        ThreadActionItem item1 = new ThreadActionItem(saved, "Review term sheet with counsel", 0);
        ThreadActionItem item2 = new ThreadActionItem(saved, "Confirm closing call for Thursday", 1);
        saved.getActionItems().add(item1);
        saved.getActionItems().add(item2);
        threadRepository.saveAndFlush(saved);

        entityManager.clear();

        Optional<EmailThread> found = threadRepository.findByWorkspaceIdAndId(workspace.getId(), saved.getId());
        assertTrue(found.isPresent());
        assertEquals("Q3 Seed Extension Term Sheet", found.get().getSubject());
        assertEquals(2, found.get().getTags().size());
        assertTrue(found.get().getTags().contains("VIP"));
        assertEquals(2, found.get().getActionItems().size());
        assertEquals("Review term sheet with counsel", found.get().getActionItems().get(0).getItemText());
    }

    @Test
    void testEmailMessage_UniqueExternalMessageId_PerAccount() {
        EmailThread thread = new EmailThread();
        thread.setWorkspace(workspace);
        thread.setSubject("API Partnership");
        thread.setSenderName("Elena Rostova");
        thread.setSenderEmail("elena@lattice.io");
        thread.setRecipientEmail("alex@jiosi.online");
        entityManager.persist(thread);

        Email msg1 = new Email();
        msg1.setWorkspace(workspace);
        msg1.setThread(thread);
        msg1.setAccount(account);
        msg1.setExternalMessageId("msg-unique-101");
        msg1.setSenderName("Elena Rostova");
        msg1.setSenderEmail("elena@lattice.io");
        msg1.setRecipientEmail("alex@jiosi.online");
        msg1.setSubject("API Partnership");
        msg1.setBodyText("Let's sync on Thursday");
        emailRepository.saveAndFlush(msg1);

        Email msg2 = new Email();
        msg2.setWorkspace(workspace);
        msg2.setThread(thread);
        msg2.setAccount(account);
        msg2.setExternalMessageId("msg-unique-101"); // Duplicate for same account
        msg2.setSenderName("Elena Rostova");
        msg2.setSenderEmail("elena@lattice.io");
        msg2.setRecipientEmail("alex@jiosi.online");
        msg2.setSubject("API Partnership Duplicate");
        msg2.setBodyText("Duplicate message payload");

        assertThrows(DataIntegrityViolationException.class, () -> {
            emailRepository.saveAndFlush(msg2);
        });
    }

    @Test
    void testDraftPersistence_SaveAndExplicitDelete() {
        EmailDraft draft = new EmailDraft(
                workspace,
                "partner@google.com",
                "Google Partnerships",
                "Exploring Gemini Integration",
                "Draft text proposing enterprise collaboration"
        );

        EmailDraft saved = draftRepository.saveAndFlush(draft);
        assertNotNull(saved.getId());

        Optional<EmailDraft> fetched = draftRepository.findByWorkspaceIdAndId(workspace.getId(), saved.getId());
        assertTrue(fetched.isPresent());
        assertEquals("Exploring Gemini Integration", fetched.get().getSubject());

        // Explicit user delete
        draftRepository.delete(saved);
        draftRepository.flush();

        Optional<EmailDraft> deleted = draftRepository.findByWorkspaceIdAndId(workspace.getId(), saved.getId());
        assertFalse(deleted.isPresent());
    }
}
