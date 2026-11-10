package com.jiosi.inbox.ai.controller;

import com.jiosi.inbox.ai.dto.*;
import com.jiosi.inbox.ai.service.EmailIntelligenceService;
import com.jiosi.inbox.common.ApiResponse;
import com.jiosi.inbox.common.UnauthorizedException;
import com.jiosi.inbox.security.UserContext;
import com.jiosi.inbox.security.WorkspaceAuthorizationService;
import com.jiosi.inbox.user.User;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/ai")
public class EmailIntelligenceController {

    private final EmailIntelligenceService intelligenceService;
    private final WorkspaceAuthorizationService workspaceAuthorizationService;

    public EmailIntelligenceController(
            EmailIntelligenceService intelligenceService,
            WorkspaceAuthorizationService workspaceAuthorizationService
    ) {
        this.intelligenceService = intelligenceService;
        this.workspaceAuthorizationService = workspaceAuthorizationService;
    }

    @PostMapping("/threads/{threadId}/summary")
    public ResponseEntity<ApiResponse<ThreadSummaryResponse>> summarizeThread(
            @RequestHeader("X-Workspace-Id") UUID workspaceId,
            @PathVariable("threadId") UUID threadId
    ) {
        User user = resolveCurrentUser();
        workspaceAuthorizationService.validateAccess(workspaceId, user);
        ThreadSummaryResponse summary = intelligenceService.summarizeThread(threadId, workspaceId, user);
        return ResponseEntity.ok(ApiResponse.ok(summary, "Thread summary generated successfully"));
    }

    @PostMapping("/threads/{threadId}/action-items")
    public ResponseEntity<ApiResponse<List<ActionItemDto>>> extractActionItems(
            @RequestHeader("X-Workspace-Id") UUID workspaceId,
            @PathVariable("threadId") UUID threadId
    ) {
        User user = resolveCurrentUser();
        workspaceAuthorizationService.validateAccess(workspaceId, user);
        List<ActionItemDto> items = intelligenceService.extractActionItems(threadId, workspaceId, user);
        return ResponseEntity.ok(ApiResponse.ok(items, "Action items extracted successfully"));
    }

    @PostMapping("/threads/{threadId}/reply-draft")
    public ResponseEntity<ApiResponse<ReplyDraftResponse>> generateReplyDraft(
            @RequestHeader("X-Workspace-Id") UUID workspaceId,
            @PathVariable("threadId") UUID threadId,
            @Valid @RequestBody(required = false) ReplyDraftRequest request
    ) {
        User user = resolveCurrentUser();
        workspaceAuthorizationService.validateAccess(workspaceId, user);
        ReplyDraftRequest effectiveRequest = (request != null) ? request : new ReplyDraftRequest("professional", "match_thread", null);
        ReplyDraftResponse response = intelligenceService.generateReplyDraft(threadId, workspaceId, user, effectiveRequest);
        return ResponseEntity.ok(ApiResponse.ok(response, "Reply draft generated successfully"));
    }

    @PostMapping("/threads/{threadId}/triage")
    public ResponseEntity<ApiResponse<TriageClassificationResponse>> triageThread(
            @RequestHeader("X-Workspace-Id") UUID workspaceId,
            @PathVariable("threadId") UUID threadId
    ) {
        User user = resolveCurrentUser();
        workspaceAuthorizationService.validateAccess(workspaceId, user);
        TriageClassificationResponse triage = intelligenceService.triageThread(threadId, workspaceId, user);
        return ResponseEntity.ok(ApiResponse.ok(triage, "Thread triage analyzed successfully"));
    }

    @PostMapping("/threads/{threadId}/triage/correction")
    public ResponseEntity<ApiResponse<TriageClassificationResponse>> correctTriage(
            @RequestHeader("X-Workspace-Id") UUID workspaceId,
            @PathVariable("threadId") UUID threadId,
            @Valid @RequestBody TriageCorrectionRequest request
    ) {
        User user = resolveCurrentUser();
        workspaceAuthorizationService.validateAccess(workspaceId, user);
        TriageClassificationResponse corrected = intelligenceService.correctTriage(threadId, workspaceId, user, request);
        return ResponseEntity.ok(ApiResponse.ok(corrected, "Triage feedback updated successfully"));
    }

    @PostMapping("/compose/assist")
    public ResponseEntity<ApiResponse<ComposeAssistResponse>> assistCompose(
            @Valid @RequestBody ComposeAssistRequest request
    ) {
        User user = resolveCurrentUser();
        ComposeAssistResponse response = intelligenceService.assistCompose(request, user);
        return ResponseEntity.ok(ApiResponse.ok(response, "Compose assistance generated successfully"));
    }

    @GetMapping("/preferences")
    public ResponseEntity<ApiResponse<UserAiPreferencesDto>> getPreferences() {
        User user = resolveCurrentUser();
        UserAiPreferencesDto dto = intelligenceService.getPreferences(user);
        return ResponseEntity.ok(ApiResponse.ok(dto, "User AI preferences retrieved"));
    }

    @PutMapping("/preferences")
    public ResponseEntity<ApiResponse<UserAiPreferencesDto>> updatePreferences(
            @RequestBody UserAiPreferencesDto dto
    ) {
        User user = resolveCurrentUser();
        UserAiPreferencesDto updated = intelligenceService.updatePreferences(
                user,
                dto.aiProcessingConsent(),
                dto.defaultReplyTone(),
                dto.defaultReplyLanguage()
        );
        return ResponseEntity.ok(ApiResponse.ok(updated, "User AI preferences updated"));
    }

    private User resolveCurrentUser() {
        User user = UserContext.getUser();
        if (user != null) {
            return user;
        }

        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.isAuthenticated() && auth.getPrincipal() instanceof User userPrincipal) {
            return userPrincipal;
        }

        throw new UnauthorizedException("Authentication required: missing or invalid credentials");
    }
}

