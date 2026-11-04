package com.jiosi.inbox.gmail;

import com.jiosi.inbox.common.ApiResponse;
import com.jiosi.inbox.common.UnauthorizedException;
import com.jiosi.inbox.gmail.dto.GmailMessageDetail;
import com.jiosi.inbox.gmail.dto.GmailMessagesPageResponse;
import com.jiosi.inbox.gmail.dto.GmailStatusResponse;
import com.jiosi.inbox.security.UserContext;
import com.jiosi.inbox.user.User;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/gmail")
public class GmailController {

    private final GmailService gmailService;
    private final String backendBaseUrl;

    public GmailController(
            GmailService gmailService,
            @Value("${app.backend-url:${SERVER_URL:http://localhost:8080}}") String backendBaseUrl
    ) {
        this.gmailService = gmailService;
        this.backendBaseUrl = backendBaseUrl.endsWith("/") ? backendBaseUrl.substring(0, backendBaseUrl.length() - 1) : backendBaseUrl;
    }

    @GetMapping("/connect-url")
    public ResponseEntity<ApiResponse<Map<String, String>>> getConnectUrl(
            @RequestHeader(value = "X-Workspace-Id", required = false) UUID workspaceId
    ) {
        User user = resolveCurrentUser();
        String url = backendBaseUrl + "/oauth2/authorization/google?action=connect_gmail&user_id=" + user.getId();
        if (workspaceId != null) {
            url += "&workspace_id=" + workspaceId;
        }

        return ResponseEntity.ok(ApiResponse.ok(
                Map.of("connectUrl", url),
                "Gmail authorization URL generated"
        ));
    }

    @GetMapping("/status")
    public ResponseEntity<ApiResponse<GmailStatusResponse>> getStatus(
            @RequestHeader(value = "X-Workspace-Id", required = false) UUID workspaceId
    ) {
        User user = resolveCurrentUser();
        GmailStatusResponse status = gmailService.getStatus(user.getId(), workspaceId);
        return ResponseEntity.ok(ApiResponse.ok(status, "Gmail connection status"));
    }

    @PostMapping("/disconnect")
    public ResponseEntity<ApiResponse<Map<String, Object>>> disconnect(
            @RequestHeader(value = "X-Workspace-Id", required = false) UUID workspaceId
    ) {
        User user = resolveCurrentUser();
        gmailService.disconnect(user.getId(), workspaceId);
        return ResponseEntity.ok(ApiResponse.ok(
                Map.of("success", true, "status", "DISCONNECTED"),
                "Gmail account disconnected successfully"
        ));
    }

    @GetMapping("/messages")
    public ResponseEntity<ApiResponse<GmailMessagesPageResponse>> getMessages(
            @RequestHeader(value = "X-Workspace-Id", required = false) UUID workspaceId,
            @RequestParam(name = "maxResults", defaultValue = "20") int maxResults,
            @RequestParam(name = "pageToken", required = false) String pageToken
    ) {
        User user = resolveCurrentUser();
        GmailMessagesPageResponse response = gmailService.getInboxMessages(
                user.getId(), workspaceId, maxResults, pageToken
        );
        return ResponseEntity.ok(ApiResponse.ok(response, "Gmail inbox messages retrieved"));
    }

    @GetMapping("/messages/{id}")
    public ResponseEntity<ApiResponse<GmailMessageDetail>> getMessageDetail(
            @RequestHeader(value = "X-Workspace-Id", required = false) UUID workspaceId,
            @PathVariable("id") String messageId
    ) {
        User user = resolveCurrentUser();
        GmailMessageDetail detail = gmailService.getMessageDetail(user.getId(), workspaceId, messageId);
        return ResponseEntity.ok(ApiResponse.ok(detail, "Gmail message detail retrieved"));
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

