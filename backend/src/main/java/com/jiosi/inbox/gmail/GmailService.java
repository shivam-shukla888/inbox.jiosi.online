package com.jiosi.inbox.gmail;

import com.fasterxml.jackson.databind.JsonNode;
import com.jiosi.inbox.common.ResourceNotFoundException;
import com.jiosi.inbox.connectedaccount.ConnectedAccount;
import com.jiosi.inbox.connectedaccount.ConnectedAccountRepository;
import com.jiosi.inbox.gmail.dto.GmailMessageDetail;
import com.jiosi.inbox.gmail.dto.GmailMessageSummary;
import com.jiosi.inbox.gmail.dto.GmailMessagesPageResponse;
import com.jiosi.inbox.gmail.dto.GmailStatusResponse;
import com.jiosi.inbox.security.TokenEncryptionService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.*;

@Service
public class GmailService {

    private static final Logger log = LoggerFactory.getLogger(GmailService.class);
    private static final String PROVIDER = "gmail";

    private final ConnectedAccountRepository connectedAccountRepository;
    private final TokenEncryptionService tokenEncryptionService;
    private final GmailClient gmailApiClient;

    private final String clientId;
    private final String clientSecret;

    public GmailService(
            ConnectedAccountRepository connectedAccountRepository,
            TokenEncryptionService tokenEncryptionService,
            GmailClient gmailApiClient,
            @Value("${spring.security.oauth2.client.registration.google.client-id:${GOOGLE_CLIENT_ID:}}") String clientId,
            @Value("${spring.security.oauth2.client.registration.google.client-secret:${GOOGLE_CLIENT_SECRET:}}") String clientSecret
    ) {
        this.connectedAccountRepository = connectedAccountRepository;
        this.tokenEncryptionService = tokenEncryptionService;
        this.gmailApiClient = gmailApiClient;
        this.clientId = clientId;
        this.clientSecret = clientSecret;
    }

    @Transactional(readOnly = true)
    public GmailStatusResponse getStatus(UUID userId, UUID workspaceId) {
        Optional<ConnectedAccount> accountOpt = findAccount(userId, workspaceId);

        if (accountOpt.isEmpty() || !"CONNECTED".equalsIgnoreCase(accountOpt.get().getStatus())) {
            return new GmailStatusResponse(
                    false,
                    accountOpt.map(ConnectedAccount::getId).orElse(null),
                    accountOpt.map(ConnectedAccount::getEmailAddress).orElse(null),
                    PROVIDER,
                    accountOpt.map(ConnectedAccount::getStatus).orElse("DISCONNECTED"),
                    accountOpt.map(ConnectedAccount::getLastSyncAt).orElse(null),
                    null,
                    accountOpt.map(ConnectedAccount::getScope).orElse(null)
            );
        }

        ConnectedAccount account = accountOpt.get();
        return new GmailStatusResponse(
                true,
                account.getId(),
                account.getEmailAddress(),
                PROVIDER,
                account.getStatus(),
                account.getLastSyncAt(),
                account.getTokenExpiresAt(),
                account.getScope()
        );
    }

    @Transactional
    public void disconnect(UUID userId, UUID workspaceId) {
        ConnectedAccount account = findAccount(userId, workspaceId)
                .orElseThrow(() -> new ResourceNotFoundException("No connected Gmail account found for user"));

        // Attempt revocation with Google
        try {
            if (account.getRefreshTokenEncrypted() != null) {
                String refreshToken = tokenEncryptionService.decrypt(account.getRefreshTokenEncrypted());
                gmailApiClient.revokeToken(refreshToken);
            } else if (account.getAccessTokenEncrypted() != null) {
                String accessToken = tokenEncryptionService.decrypt(account.getAccessTokenEncrypted());
                gmailApiClient.revokeToken(accessToken);
            }
        } catch (Exception e) {
            log.warn("Non-fatal error during Google token revocation on disconnect: {}", e.getMessage());
        }

        account.setStatus("DISCONNECTED");
        account.setAccessTokenEncrypted(null);
        account.setRefreshTokenEncrypted(null);
        account.setTokenExpiresAt(null);
        connectedAccountRepository.save(account);
        log.info("Disconnected Gmail account {} for user {}", account.getEmailAddress(), userId);
    }

    @Transactional
    public GmailMessagesPageResponse getInboxMessages(UUID userId, UUID workspaceId, int maxResults, String pageToken) {
        ConnectedAccount account = findConnectedAccount(userId, workspaceId);
        String accessToken = getValidAccessToken(account);

        int fetchLimit = Math.max(1, Math.min(maxResults, 25));
        JsonNode listResponse = gmailApiClient.listMessages(accessToken, fetchLimit, pageToken, "in:inbox");

        List<GmailMessageSummary> summaries = new ArrayList<>();
        JsonNode messagesNode = listResponse.path("messages");

        if (messagesNode.isArray()) {
            for (JsonNode item : messagesNode) {
                String messageId = item.path("id").asText();
                try {
                    JsonNode detailNode = gmailApiClient.getMessage(accessToken, messageId);
                    summaries.add(parseMessageSummary(detailNode));
                } catch (Exception e) {
                    log.warn("Failed to fetch detail for Gmail message {}: {}", messageId, e.getMessage());
                }
            }
        }

        String nextPageToken = listResponse.path("nextPageToken").asText(null);
        int resultSizeEstimate = listResponse.path("resultSizeEstimate").asInt(summaries.size());

        account.setLastSyncAt(Instant.now());
        connectedAccountRepository.save(account);

        return new GmailMessagesPageResponse(summaries, nextPageToken, resultSizeEstimate);
    }

    @Transactional
    public GmailMessageDetail getMessageDetail(UUID userId, UUID workspaceId, String messageId) {
        ConnectedAccount account = findConnectedAccount(userId, workspaceId);
        String accessToken = getValidAccessToken(account);

        JsonNode detailNode = gmailApiClient.getMessage(accessToken, messageId);
        return parseMessageDetail(detailNode);
    }

    private ConnectedAccount findConnectedAccount(UUID userId, UUID workspaceId) {
        return findAccount(userId, workspaceId)
                .filter(acc -> "CONNECTED".equalsIgnoreCase(acc.getStatus()))
                .orElseThrow(() -> new ResourceNotFoundException("No connected Gmail account found for this user. Please connect your Gmail account."));
    }

    private Optional<ConnectedAccount> findAccount(UUID userId, UUID workspaceId) {
        if (workspaceId != null) {
            Optional<ConnectedAccount> wsAccount = connectedAccountRepository
                    .findFirstByUserIdAndWorkspaceIdAndProvider(userId, workspaceId, PROVIDER);
            if (wsAccount.isPresent()) {
                return wsAccount;
            }
        }
        return connectedAccountRepository.findFirstByUserIdAndProvider(userId, PROVIDER);
    }

    private synchronized String getValidAccessToken(ConnectedAccount account) {
        Instant expiresAt = account.getTokenExpiresAt();
        boolean needsRefresh = expiresAt == null || expiresAt.isBefore(Instant.now().plusSeconds(300)); // Refresh if < 5m remaining

        if (needsRefresh) {
            String encryptedRefreshToken = account.getRefreshTokenEncrypted();
            if (encryptedRefreshToken == null || encryptedRefreshToken.isBlank()) {
                // If refresh token is missing, attempt using current access token if not completely expired
                if (expiresAt != null && expiresAt.isAfter(Instant.now())) {
                    return tokenEncryptionService.decrypt(account.getAccessTokenEncrypted());
                }
                account.setStatus("REVOKED");
                connectedAccountRepository.save(account);
                throw new GmailAuthRevokedException("Google refresh token unavailable. Please reconnect your Gmail account.");
            }

            try {
                String plainRefreshToken = tokenEncryptionService.decrypt(encryptedRefreshToken);
                GmailApiClient.TokenRefreshResult refreshResult = gmailApiClient.refreshAccessToken(
                        plainRefreshToken, clientId, clientSecret
                );

                account.setAccessTokenEncrypted(tokenEncryptionService.encrypt(refreshResult.accessToken()));
                account.setTokenExpiresAt(refreshResult.expiresAt());
                if (refreshResult.scope() != null) {
                    account.setScope(refreshResult.scope());
                }
                connectedAccountRepository.save(account);
                return refreshResult.accessToken();
            } catch (GmailAuthRevokedException e) {
                account.setStatus("REVOKED");
                connectedAccountRepository.save(account);
                throw e;
            }
        }

        return tokenEncryptionService.decrypt(account.getAccessTokenEncrypted());
    }

    private GmailMessageSummary parseMessageSummary(JsonNode node) {
        String id = node.path("id").asText();
        String threadId = node.path("threadId").asText();
        String snippet = node.path("snippet").asText("");
        long internalDate = node.path("internalDate").asLong(System.currentTimeMillis());
        Instant receivedAt = Instant.ofEpochMilli(internalDate);

        List<String> labelIds = new ArrayList<>();
        JsonNode labelsNode = node.path("labelIds");
        if (labelsNode.isArray()) {
            labelsNode.forEach(l -> labelIds.add(l.asText()));
        }

        boolean isUnread = labelIds.contains("UNREAD");
        boolean isStarred = labelIds.contains("STARRED");

        Map<String, String> headers = extractHeaders(node);
        String subject = headers.getOrDefault("subject", "(No Subject)");
        String fromHeader = headers.getOrDefault("from", "Unknown Sender");
        String recipientEmail = headers.getOrDefault("to", "");

        String[] senderParts = parseSender(fromHeader);

        return new GmailMessageSummary(
                id,
                threadId,
                subject,
                senderParts[0],
                senderParts[1],
                recipientEmail,
                snippet,
                receivedAt,
                isUnread,
                isStarred,
                labelIds
        );
    }

    private GmailMessageDetail parseMessageDetail(JsonNode node) {
        String id = node.path("id").asText();
        String threadId = node.path("threadId").asText();
        String snippet = node.path("snippet").asText("");
        long internalDate = node.path("internalDate").asLong(System.currentTimeMillis());
        Instant receivedAt = Instant.ofEpochMilli(internalDate);

        List<String> labelIds = new ArrayList<>();
        JsonNode labelsNode = node.path("labelIds");
        if (labelsNode.isArray()) {
            labelsNode.forEach(l -> labelIds.add(l.asText()));
        }

        boolean isUnread = labelIds.contains("UNREAD");
        boolean isStarred = labelIds.contains("STARRED");

        Map<String, String> headers = extractHeaders(node);
        String subject = headers.getOrDefault("subject", "(No Subject)");
        String fromHeader = headers.getOrDefault("from", "Unknown Sender");
        String recipientEmail = headers.getOrDefault("to", "");
        String cc = headers.getOrDefault("cc", null);

        String[] senderParts = parseSender(fromHeader);

        StringBuilder bodyTextBuilder = new StringBuilder();
        StringBuilder bodyHtmlBuilder = new StringBuilder();
        boolean[] hasAttachments = new boolean[]{false};

        extractBodyContent(node.path("payload"), bodyTextBuilder, bodyHtmlBuilder, hasAttachments);

        String bodyText = bodyTextBuilder.toString().trim();
        String bodyHtml = bodyHtmlBuilder.toString().trim();

        if (bodyText.isEmpty() && !snippet.isEmpty()) {
            bodyText = snippet;
        }

        return new GmailMessageDetail(
                id,
                threadId,
                subject,
                senderParts[0],
                senderParts[1],
                recipientEmail,
                cc,
                snippet,
                bodyText,
                bodyHtml,
                receivedAt,
                isUnread,
                isStarred,
                hasAttachments[0],
                labelIds
        );
    }

    private Map<String, String> extractHeaders(JsonNode node) {
        Map<String, String> map = new HashMap<>();
        JsonNode headers = node.path("payload").path("headers");
        if (headers.isArray()) {
            for (JsonNode h : headers) {
                String name = h.path("name").asText("").toLowerCase(Locale.ROOT);
                String val = h.path("value").asText("");
                map.put(name, val);
            }
        }
        return map;
    }

    private String[] parseSender(String fromHeader) {
        // e.g. "Alex Rivera <alex@jiosi.online>" or "alex@jiosi.online"
        String name = fromHeader;
        String email = fromHeader;

        if (fromHeader.contains("<") && fromHeader.contains(">")) {
            int start = fromHeader.indexOf('<');
            int end = fromHeader.indexOf('>');
            name = fromHeader.substring(0, start).trim();
            email = fromHeader.substring(start + 1, end).trim();
            if (name.startsWith("\"") && name.endsWith("\"")) {
                name = name.substring(1, name.length() - 1).trim();
            }
        }

        if (name.isBlank()) {
            name = email;
        }

        return new String[]{name, email};
    }

    private void extractBodyContent(JsonNode part, StringBuilder bodyText, StringBuilder bodyHtml, boolean[] hasAttachments) {
        if (part == null || part.isMissingNode()) {
            return;
        }

        String mimeType = part.path("mimeType").asText("");
        String filename = part.path("filename").asText("");

        if (!filename.isBlank()) {
            hasAttachments[0] = true;
        }

        String data = part.path("body").path("data").asText("");
        if (!data.isBlank()) {
            try {
                byte[] decoded = Base64.getUrlDecoder().decode(data);
                String decodedStr = new String(decoded, StandardCharsets.UTF_8);
                if (mimeType.equalsIgnoreCase("text/plain")) {
                    bodyText.append(decodedStr);
                } else if (mimeType.equalsIgnoreCase("text/html")) {
                    bodyHtml.append(decodedStr);
                }
            } catch (Exception e) {
                log.debug("Could not decode part body: {}", e.getMessage());
            }
        }

        JsonNode parts = part.path("parts");
        if (parts.isArray()) {
            for (JsonNode subPart : parts) {
                extractBodyContent(subPart, bodyText, bodyHtml, hasAttachments);
            }
        }
    }
}
