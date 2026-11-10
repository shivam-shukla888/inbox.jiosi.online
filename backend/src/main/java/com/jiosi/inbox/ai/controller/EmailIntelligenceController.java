package com.jiosi.inbox.ai.controller;

import com.jiosi.inbox.ai.dto.*;
import com.jiosi.inbox.ai.entity.UserBusinessProfile;
import com.jiosi.inbox.ai.service.BusinessProfileService;
import com.jiosi.inbox.ai.service.CommitmentService;
import com.jiosi.inbox.ai.service.DailyBriefService;
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
    private final BusinessProfileService businessProfileService;
    private final CommitmentService commitmentService;
    private final DailyBriefService dailyBriefService;

    public EmailIntelligenceController(
            EmailIntelligenceService intelligenceService,
            WorkspaceAuthorizationService workspaceAuthorizationService,
            BusinessProfileService businessProfileService,
            CommitmentService commitmentService,
            DailyBriefService dailyBriefService
    ) {
        this.intelligenceService = intelligenceService;
        this.workspaceAuthorizationService = workspaceAuthorizationService;
        this.businessProfileService = businessProfileService;
        this.commitmentService = commitmentService;
        this.dailyBriefService = dailyBriefService;
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

    // -------------------------------------------------------------
    // SMALL BUSINESS PROFILE ENDPOINTS
    // -------------------------------------------------------------

    @GetMapping("/profile")
    public ResponseEntity<ApiResponse<UserBusinessProfileDto>> getBusinessProfile(
            @RequestHeader("X-Workspace-Id") UUID workspaceId
    ) {
        User user = resolveCurrentUser();
        workspaceAuthorizationService.validateAccess(workspaceId, user);
        UserBusinessProfile profile = businessProfileService.getOrCreateProfile(user, workspaceId);
        return ResponseEntity.ok(ApiResponse.ok(businessProfileService.toDto(profile), "Business profile retrieved"));
    }

    @PutMapping("/profile")
    public ResponseEntity<ApiResponse<UserBusinessProfileDto>> updateBusinessProfile(
            @RequestHeader("X-Workspace-Id") UUID workspaceId,
            @RequestBody UserBusinessProfileDto dto
    ) {
        User user = resolveCurrentUser();
        workspaceAuthorizationService.validateAccess(workspaceId, user);
        UserBusinessProfileDto updated = businessProfileService.updateProfile(user, workspaceId, dto);
        return ResponseEntity.ok(ApiResponse.ok(updated, "Business profile updated successfully"));
    }

    // -------------------------------------------------------------
    // COMMITMENTS & "WHO OWES NEXT STEP" ENDPOINTS
    // -------------------------------------------------------------

    @GetMapping("/commitments")
    public ResponseEntity<ApiResponse<List<EmailCommitmentDto>>> getWorkspaceCommitments(
            @RequestHeader("X-Workspace-Id") UUID workspaceId,
            @RequestParam(name = "status", required = false) String status,
            @RequestParam(name = "actor", required = false) String actor
    ) {
        User user = resolveCurrentUser();
        workspaceAuthorizationService.validateAccess(workspaceId, user);
        List<EmailCommitmentDto> list = commitmentService.getWorkspaceCommitments(workspaceId, user, status, actor);
        return ResponseEntity.ok(ApiResponse.ok(list, "Commitments retrieved successfully"));
    }

    @GetMapping("/threads/{threadId}/commitments")
    public ResponseEntity<ApiResponse<List<EmailCommitmentDto>>> getThreadCommitments(
            @RequestHeader("X-Workspace-Id") UUID workspaceId,
            @PathVariable("threadId") UUID threadId
    ) {
        User user = resolveCurrentUser();
        workspaceAuthorizationService.validateAccess(workspaceId, user);
        List<EmailCommitmentDto> list = commitmentService.getThreadCommitments(threadId, workspaceId, user);
        return ResponseEntity.ok(ApiResponse.ok(list, "Thread commitments retrieved successfully"));
    }

    @PostMapping("/threads/{threadId}/commitments/sync")
    public ResponseEntity<ApiResponse<List<EmailCommitmentDto>>> syncThreadCommitments(
            @RequestHeader("X-Workspace-Id") UUID workspaceId,
            @PathVariable("threadId") UUID threadId
    ) {
        User user = resolveCurrentUser();
        workspaceAuthorizationService.validateAccess(workspaceId, user);
        List<EmailCommitmentDto> list = commitmentService.extractAndSyncCommitments(threadId, workspaceId, user);
        return ResponseEntity.ok(ApiResponse.ok(list, "Thread commitments synchronized successfully"));
    }

    @PatchMapping("/commitments/{commitmentId}/status")
    public ResponseEntity<ApiResponse<EmailCommitmentDto>> updateCommitmentStatus(
            @RequestHeader("X-Workspace-Id") UUID workspaceId,
            @PathVariable("commitmentId") UUID commitmentId,
            @Valid @RequestBody CommitmentStatusUpdateRequest request
    ) {
        User user = resolveCurrentUser();
        workspaceAuthorizationService.validateAccess(workspaceId, user);
        EmailCommitmentDto updated = commitmentService.updateCommitmentStatus(commitmentId, workspaceId, user, request);
        return ResponseEntity.ok(ApiResponse.ok(updated, "Commitment status updated successfully"));
    }

    // -------------------------------------------------------------
    // DAILY BUSINESS BRIEF ENDPOINTS
    // -------------------------------------------------------------

    @GetMapping("/daily-brief")
    public ResponseEntity<ApiResponse<DailyBriefResponse>> getDailyBrief(
            @RequestHeader("X-Workspace-Id") UUID workspaceId,
            @RequestParam(name = "forceRefresh", defaultValue = "false") boolean forceRefresh
    ) {
        User user = resolveCurrentUser();
        workspaceAuthorizationService.validateAccess(workspaceId, user);
        DailyBriefResponse brief = dailyBriefService.getDailyBrief(workspaceId, user, forceRefresh);
        return ResponseEntity.ok(ApiResponse.ok(brief, "Daily brief retrieved successfully"));
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
