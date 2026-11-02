package com.jiosi.inbox.api;

import com.jiosi.inbox.email.EmailThread;
import com.jiosi.inbox.email.EmailThreadRepository;
import com.jiosi.inbox.email.EmailThreadService;
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
import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicInteger;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("test")
class PaginationAndConcurrencyTest {

    @Autowired
    private EmailThreadService threadService;

    @Autowired
    private EmailThreadRepository threadRepository;

    @Autowired
    private WorkspaceRepository workspaceRepository;

    @Autowired
    private UserRepository userRepository;

    private Workspace workspace;
    private EmailThread thread;

    @BeforeEach
    void setUp() {
        String uniqueSuffix = UUID.randomUUID().toString().substring(0, 8);
        User user = userRepository.save(new User("conc." + uniqueSuffix + "@jiosi.online", "Concurrent Tester", "CT"));
        workspace = workspaceRepository.save(new Workspace("Concurrency WS " + uniqueSuffix, "conc-ws-" + uniqueSuffix, user));

        for (int i = 0; i < 25; i++) {
            EmailThread t = new EmailThread();
            t.setWorkspace(workspace);
            t.setSubject("Batch Item " + i);
            t.setSnippet("Snippet " + i);
            t.setSenderName("Sender " + i);
            t.setSenderEmail("sender" + i + "@test.com");
            t.setRecipientEmail("concurrency.test@jiosi.online");
            t.setUnread(i % 2 == 0);
            t.setStarred(i % 3 == 0);
            threadRepository.save(t);
            if (i == 0) {
                thread = t;
            }
        }
    }

    @Test
    void testPagination_BoundsAndPageSizeClamp() {
        // Request with size > 100 should be clamped to 100
        PagedThreadsResponse response = threadService.getThreads(workspace.getId(), "inbox", "all", 0, 500);
        assertTrue(response.pageSize() <= 100);
        assertEquals(25, response.totalElements());
        assertEquals(25, response.threads().size());

        // Request with page 0, size 10
        PagedThreadsResponse page0 = threadService.getThreads(workspace.getId(), "inbox", "all", 0, 10);
        assertEquals(10, page0.threads().size());
        assertEquals(3, page0.totalPages());
        assertTrue(page0.isFirst());
        assertFalse(page0.isLast());

        // Request with page 2 (last page with 5 elements)
        PagedThreadsResponse page2 = threadService.getThreads(workspace.getId(), "inbox", "all", 2, 10);
        assertEquals(5, page2.threads().size());
        assertTrue(page2.isLast());
    }

    @Test
    void testConcurrentUpdates_ThreadState_NoDeadlocks() throws InterruptedException {
        int threadsCount = 10;
        int iterationsPerThread = 10;
        ExecutorService executor = Executors.newFixedThreadPool(threadsCount);
        CountDownLatch latch = new CountDownLatch(threadsCount);
        AtomicInteger successCount = new AtomicInteger(0);

        for (int i = 0; i < threadsCount; i++) {
            final int workerId = i;
            executor.submit(() -> {
                try {
                    for (int j = 0; j < iterationsPerThread; j++) {
                        boolean starVal = (workerId + j) % 2 == 0;
                        threadService.updateStar(workspace.getId(), thread.getId(), starVal);
                        threadService.updateRead(workspace.getId(), thread.getId(), !starVal);
                    }
                    successCount.incrementAndGet();
                } catch (Exception e) {
                    e.printStackTrace();
                } finally {
                    latch.countDown();
                }
            });
        }

        boolean finished = latch.await(15, TimeUnit.SECONDS);
        executor.shutdown();

        assertTrue(finished, "Concurrent execution timed out");
        assertEquals(threadsCount, successCount.get(), "All concurrent workers should complete successfully without deadlocks");
    }
}
