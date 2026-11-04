package com.jiosi.inbox.gmail;

import com.fasterxml.jackson.databind.JsonNode;

public interface GmailClient {
    GmailApiClient.TokenRefreshResult refreshAccessToken(String refreshToken, String clientId, String clientSecret);
    void revokeToken(String token);
    JsonNode listMessages(String accessToken, int maxResults, String pageToken, String query);
    JsonNode getMessage(String accessToken, String messageId);
}

