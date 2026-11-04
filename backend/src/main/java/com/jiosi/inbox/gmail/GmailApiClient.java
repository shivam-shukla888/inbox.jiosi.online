package com.jiosi.inbox.gmail;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.HttpServerErrorException;
import org.springframework.web.client.RestClient;

import java.time.Instant;
import java.util.Map;
import java.util.Random;

/**
 * Enterprise client for Google OAuth2 Token Refresh and Gmail v1 REST API.
 * Includes automatic rate-limit backoff with jitter and strictly read-only execution.
 */
@Component
public class GmailApiClient implements GmailClient {

    private static final Logger log = LoggerFactory.getLogger(GmailApiClient.class);

    private static final String GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
    private static final String GOOGLE_REVOKE_URL = "https://oauth2.googleapis.com/revoke";
    private static final String GMAIL_API_BASE_URL = "https://gmail.googleapis.com/gmail/v1/users/me";

    private final RestClient restClient;
    private final ObjectMapper objectMapper;
    private final Random random = new Random();

    public GmailApiClient(RestClient.Builder restClientBuilder, ObjectMapper objectMapper) {
        this.restClient = restClientBuilder.build();
        this.objectMapper = objectMapper;
    }

    public record TokenRefreshResult(String accessToken, Instant expiresAt, String scope) {}

    /**
     * Refreshes an expired Google OAuth access token using a refresh token.
     */
    public TokenRefreshResult refreshAccessToken(String refreshToken, String clientId, String clientSecret) {
        if (refreshToken == null || refreshToken.isBlank()) {
            throw new GmailAuthRevokedException("No refresh token available to refresh access token");
        }

        MultiValueMap<String, String> formData = new LinkedMultiValueMap<>();
        formData.add("client_id", clientId);
        formData.add("client_secret", clientSecret);
        formData.add("refresh_token", refreshToken);
        formData.add("grant_type", "refresh_token");

        try {
            String responseBody = restClient.post()
                    .uri(GOOGLE_TOKEN_URL)
                    .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                    .body(formData)
                    .retrieve()
                    .body(String.class);

            JsonNode root = objectMapper.readTree(responseBody);
            String newAccessToken = root.path("access_token").asText();
            long expiresIn = root.path("expires_in").asLong(3600);
            String scope = root.path("scope").asText(null);

            if (newAccessToken == null || newAccessToken.isBlank()) {
                throw new GmailApiException("Google token endpoint returned empty access token", 502);
            }

            Instant expiresAt = Instant.now().plusSeconds(expiresIn);
            log.info("Successfully refreshed Google OAuth access token (valid for {}s)", expiresIn);
            return new TokenRefreshResult(newAccessToken, expiresAt, scope);

        } catch (HttpClientErrorException.BadRequest e) {
            String body = e.getResponseBodyAsString();
            log.warn("Google token refresh rejected (400 Bad Request): {}", body.contains("invalid_grant") ? "invalid_grant" : "error");
            if (body.contains("invalid_grant") || body.contains("unauthorized_client")) {
                throw new GmailAuthRevokedException("User revoked Google OAuth authorization or refresh token expired");
            }
            throw new GmailApiException("Failed to refresh Google OAuth token: " + e.getMessage(), 400);
        } catch (Exception e) {
            log.error("Unexpected error during Google token refresh: {}", e.getMessage());
            throw new GmailApiException("Google token refresh failed: " + e.getMessage(), 502);
        }
    }

    /**
     * Revokes access or refresh token with Google when user disconnects account.
     */
    public void revokeToken(String token) {
        if (token == null || token.isBlank()) {
            return;
        }
        try {
            restClient.post()
                    .uri(GOOGLE_REVOKE_URL + "?token=" + token)
                    .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                    .retrieve()
                    .toBodilessEntity();
            log.info("Successfully revoked Google OAuth token");
        } catch (Exception e) {
            // Non-fatal if token is already expired/revoked
            log.debug("Token revocation returned non-200 (harmless if already revoked): {}", e.getMessage());
        }
    }

    /**
     * Lists messages from Gmail with optional pagination token and search query.
     */
    public JsonNode listMessages(String accessToken, int maxResults, String pageToken, String query) {
        StringBuilder uriBuilder = new StringBuilder(GMAIL_API_BASE_URL)
                .append("/messages?maxResults=").append(Math.min(maxResults, 50));

        if (pageToken != null && !pageToken.isBlank()) {
            uriBuilder.append("&pageToken=").append(pageToken.trim());
        }
        if (query != null && !query.isBlank()) {
            uriBuilder.append("&q=").append(query.trim());
        }

        return executeWithRetry(() -> {
            String responseBody = restClient.get()
                    .uri(uriBuilder.toString())
                    .header(HttpHeaders.AUTHORIZATION, "Bearer " + accessToken)
                    .retrieve()
                    .body(String.class);

            try {
                return objectMapper.readTree(responseBody);
            } catch (Exception e) {
                throw new GmailApiException("Failed to parse Gmail list response", e, 502);
            }
        });
    }

    /**
     * Retrieves full message details by ID from Gmail.
     */
    public JsonNode getMessage(String accessToken, String messageId) {
        String uri = GMAIL_API_BASE_URL + "/messages/" + messageId + "?format=full";

        return executeWithRetry(() -> {
            String responseBody = restClient.get()
                    .uri(uri)
                    .header(HttpHeaders.AUTHORIZATION, "Bearer " + accessToken)
                    .retrieve()
                    .body(String.class);

            try {
                return objectMapper.readTree(responseBody);
            } catch (Exception e) {
                throw new GmailApiException("Failed to parse Gmail message detail response", e, 502);
            }
        });
    }

    /**
     * Executes Gmail API request with exponential backoff and jitter on 429 rate limits and 5xx server errors.
     */
    private <T> T executeWithRetry(SupplierWithException<T> action) {
        int maxAttempts = 3;
        long backoffMs = 500;

        for (int attempt = 1; attempt <= maxAttempts; attempt++) {
            try {
                return action.get();
            } catch (HttpClientErrorException e) {
                if (e.getStatusCode().value() == 401) {
                    throw new GmailApiException("Gmail API access token expired or invalid", 401);
                } else if (e.getStatusCode().value() == 403) {
                    String response = e.getResponseBodyAsString();
                    if (response.contains("rateLimitExceeded") || response.contains("userRateLimitExceeded")) {
                        if (attempt == maxAttempts) {
                            throw new GmailApiException("Gmail API rate limit exceeded after retries", 429);
                        }
                    } else {
                        throw new GmailApiException("Gmail API permission denied: check scopes", 403);
                    }
                } else if (e.getStatusCode().value() == 429) {
                    if (attempt == maxAttempts) {
                        throw new GmailApiException("Gmail API rate limit exceeded after retries", 429);
                    }
                } else if (e.getStatusCode().value() == 404) {
                    throw new GmailApiException("Gmail message not found", 404);
                } else {
                    throw new GmailApiException("Gmail API client error: " + e.getStatusCode(), e.getStatusCode().value());
                }
            } catch (HttpServerErrorException e) {
                if (attempt == maxAttempts) {
                    throw new GmailApiException("Gmail API server error after retries: " + e.getStatusCode(), 502);
                }
            } catch (GmailApiException e) {
                throw e;
            } catch (Exception e) {
                if (attempt == maxAttempts) {
                    throw new GmailApiException("Failed to communicate with Gmail API: " + e.getMessage(), 502);
                }
            }

            // Exponential backoff with random jitter (50ms - 200ms)
            long jitter = 50 + random.nextInt(150);
            long sleepTime = backoffMs + jitter;
            log.warn("Gmail API transient error (attempt {}/{}); retrying in {}ms...", attempt, maxAttempts, sleepTime);
            try {
                Thread.sleep(sleepTime);
            } catch (InterruptedException ie) {
                Thread.currentThread().interrupt();
                throw new GmailApiException("Gmail API call interrupted", 500);
            }
            backoffMs *= 2;
        }

        throw new GmailApiException("Failed to execute Gmail request after " + maxAttempts + " attempts", 500);
    }

    @FunctionalInterface
    public interface SupplierWithException<T> {
        T get() throws Exception;
    }
}
