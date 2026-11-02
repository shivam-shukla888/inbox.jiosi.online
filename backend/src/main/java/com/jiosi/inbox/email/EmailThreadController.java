package com.jiosi.inbox.email;

import com.jiosi.inbox.common.ApiResponse;
import com.jiosi.inbox.email.dto.*;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/threads")
public class EmailThreadController {

    private final EmailThreadService threadService;

    public EmailThreadController(EmailThreadService threadService) {
        this.threadService = threadService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<PagedThreadsResponse>> getThreads(
            @RequestHeader("X-Workspace-Id") UUID workspaceId,
            @RequestParam(name = "folder", defaultValue = "inbox") String folder,
            @RequestParam(name = "filter", defaultValue = "all") String filter,
            @RequestParam(name = "page", defaultValue = "0") int page,
            @RequestParam(name = "size", defaultValue = "20") int size
    ) {
        PagedThreadsResponse response = threadService.getThreads(workspaceId, folder, filter, page, size);
        return ResponseEntity.ok(ApiResponse.ok(response, "Threads retrieved successfully"));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<ThreadDetailDto>> getThread(
            @RequestHeader("X-Workspace-Id") UUID workspaceId,
            @PathVariable("id") UUID id
    ) {
        ThreadDetailDto response = threadService.getThreadDetail(workspaceId, id);
        return ResponseEntity.ok(ApiResponse.ok(response, "Thread retrieved successfully"));
    }

    @GetMapping("/search")
    public ResponseEntity<ApiResponse<PagedThreadsResponse>> searchThreads(
            @RequestHeader("X-Workspace-Id") UUID workspaceId,
            @RequestParam(name = "q", defaultValue = "") String query,
            @RequestParam(name = "page", defaultValue = "0") int page,
            @RequestParam(name = "size", defaultValue = "20") int size
    ) {
        PagedThreadsResponse response = threadService.searchThreads(workspaceId, query, page, size);
        return ResponseEntity.ok(ApiResponse.ok(response, "Search results retrieved"));
    }

    @PatchMapping("/{id}/read")
    public ResponseEntity<ApiResponse<ThreadSummaryDto>> updateRead(
            @RequestHeader("X-Workspace-Id") UUID workspaceId,
            @PathVariable("id") UUID id,
            @RequestBody UpdateReadRequest request
    ) {
        ThreadSummaryDto updated = threadService.updateRead(workspaceId, id, request.unread());
        return ResponseEntity.ok(ApiResponse.ok(updated, "Thread read status updated"));
    }

    @PatchMapping("/{id}/star")
    public ResponseEntity<ApiResponse<ThreadSummaryDto>> updateStar(
            @RequestHeader("X-Workspace-Id") UUID workspaceId,
            @PathVariable("id") UUID id,
            @RequestBody UpdateStarRequest request
    ) {
        ThreadSummaryDto updated = threadService.updateStar(workspaceId, id, request.starred());
        return ResponseEntity.ok(ApiResponse.ok(updated, "Thread star status updated"));
    }

    @PatchMapping("/{id}/archive")
    public ResponseEntity<ApiResponse<ThreadSummaryDto>> updateArchive(
            @RequestHeader("X-Workspace-Id") UUID workspaceId,
            @PathVariable("id") UUID id,
            @RequestBody UpdateArchiveRequest request
    ) {
        ThreadSummaryDto updated = threadService.updateArchive(workspaceId, id, request.archived());
        return ResponseEntity.ok(ApiResponse.ok(updated, "Thread archive status updated"));
    }

    @PatchMapping("/{id}/snooze")
    public ResponseEntity<ApiResponse<ThreadSummaryDto>> updateSnooze(
            @RequestHeader("X-Workspace-Id") UUID workspaceId,
            @PathVariable("id") UUID id,
            @RequestBody UpdateSnoozeRequest request
    ) {
        ThreadSummaryDto updated = threadService.updateSnooze(workspaceId, id, request.snoozed(), request.snoozedUntil());
        return ResponseEntity.ok(ApiResponse.ok(updated, "Thread snooze status updated"));
    }

    @PostMapping("/batch/read")
    public ResponseEntity<ApiResponse<Void>> batchUpdateRead(
            @RequestHeader("X-Workspace-Id") UUID workspaceId,
            @Valid @RequestBody BatchReadRequest request
    ) {
        threadService.batchUpdateRead(workspaceId, request.threadIds(), request.unread());
        return ResponseEntity.ok(ApiResponse.ok(null, "Batch read status updated"));
    }

    @PostMapping("/batch/archive")
    public ResponseEntity<ApiResponse<Void>> batchUpdateArchive(
            @RequestHeader("X-Workspace-Id") UUID workspaceId,
            @Valid @RequestBody BatchArchiveRequest request
    ) {
        threadService.batchUpdateArchive(workspaceId, request.threadIds(), request.archived());
        return ResponseEntity.ok(ApiResponse.ok(null, "Batch archive status updated"));
    }

    @PostMapping("/{id}/reply")
    public ResponseEntity<ApiResponse<ThreadDetailDto>> sendReply(
            @RequestHeader("X-Workspace-Id") UUID workspaceId,
            @PathVariable("id") UUID id,
            @Valid @RequestBody SendReplyRequest request
    ) {
        ThreadDetailDto updated = threadService.sendReply(workspaceId, id, request);
        return ResponseEntity.ok(ApiResponse.ok(updated, "Reply recorded successfully"));
    }

    @PostMapping("/send")
    public ResponseEntity<ApiResponse<ThreadSummaryDto>> sendEmail(
            @RequestHeader("X-Workspace-Id") UUID workspaceId,
            @Valid @RequestBody SendEmailRequest request
    ) {
        ThreadSummaryDto created = threadService.createNewThread(workspaceId, request);
        return ResponseEntity.ok(ApiResponse.ok(created, "Email recorded successfully"));
    }

    @GetMapping("/counts")
    public ResponseEntity<ApiResponse<FolderCountsDto>> getCounts(
            @RequestHeader("X-Workspace-Id") UUID workspaceId
    ) {
        FolderCountsDto counts = threadService.getFolderCounts(workspaceId);
        return ResponseEntity.ok(ApiResponse.ok(counts, "Folder counts retrieved"));
    }
}
