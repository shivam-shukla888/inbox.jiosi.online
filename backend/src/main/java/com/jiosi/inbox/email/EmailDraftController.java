package com.jiosi.inbox.email;

import com.jiosi.inbox.common.ApiResponse;
import com.jiosi.inbox.email.dto.DraftDto;
import com.jiosi.inbox.email.dto.SaveDraftRequest;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/drafts")
public class EmailDraftController {

    private final EmailDraftService draftService;

    public EmailDraftController(EmailDraftService draftService) {
        this.draftService = draftService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<Page<DraftDto>>> getDrafts(
            @RequestHeader("X-Workspace-Id") UUID workspaceId,
            @RequestParam(name = "page", defaultValue = "0") int page,
            @RequestParam(name = "size", defaultValue = "20") int size
    ) {
        Page<DraftDto> drafts = draftService.getDrafts(workspaceId, page, size);
        return ResponseEntity.ok(ApiResponse.ok(drafts, "Drafts retrieved successfully"));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<DraftDto>> getDraft(
            @RequestHeader("X-Workspace-Id") UUID workspaceId,
            @PathVariable("id") UUID id
    ) {
        DraftDto draft = draftService.getDraft(workspaceId, id);
        return ResponseEntity.ok(ApiResponse.ok(draft, "Draft retrieved successfully"));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<DraftDto>> saveDraft(
            @RequestHeader("X-Workspace-Id") UUID workspaceId,
            @Valid @RequestBody SaveDraftRequest request
    ) {
        DraftDto saved = draftService.saveDraft(workspaceId, request);
        return ResponseEntity.ok(ApiResponse.ok(saved, "Draft saved successfully"));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteDraft(
            @RequestHeader("X-Workspace-Id") UUID workspaceId,
            @PathVariable("id") UUID id
    ) {
        draftService.deleteDraft(workspaceId, id);
        return ResponseEntity.ok(ApiResponse.ok(null, "Draft deleted successfully"));
    }
}
