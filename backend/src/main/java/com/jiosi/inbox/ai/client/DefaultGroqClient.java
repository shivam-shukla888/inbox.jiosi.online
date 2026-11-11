package com.jiosi.inbox.ai.client;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.jiosi.inbox.ai.config.GroqProperties;
import com.jiosi.inbox.ai.dto.GroqChatRequest;
import com.jiosi.inbox.ai.dto.GroqChatResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.MediaType;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestClient;

import java.time.Duration;
import java.time.Instant;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;

@Component
public class DefaultGroqClient implements GroqClient {

    private static final Logger log = LoggerFactory.getLogger(DefaultGroqClient.class);
    private static final long MAX_BACKOFF_MS = 5000L;
    private static final long INITIAL_BACKOFF_MS = 500L;

    private final GroqProperties properties;
    private final RestClient restClient;
    private final ObjectMapper objectMapper;

    @org.springframework.beans.factory.annotation.Autowired
    public DefaultGroqClient(GroqProperties properties, RestClient.Builder restClientBuilder, ObjectMapper objectMapper) {
        this.properties = properties;
        this.objectMapper = objectMapper;

        // Apply timeout configuration to HTTP client request factory
        SimpleClientHttpRequestFactory requestFactory = new SimpleClientHttpRequestFactory();
        int timeoutSeconds = properties.getTimeoutSeconds() > 0 ? properties.getTimeoutSeconds() : 15;
        Duration timeout = Duration.ofSeconds(timeoutSeconds);
        requestFactory.setConnectTimeout(timeout);
        requestFactory.setReadTimeout(timeout);

        // Configure baseUrl, timeout request factory, and default headers
        this.restClient = restClientBuilder
                .requestFactory(requestFactory)
                .baseUrl(properties.getBaseUrl())
                .defaultHeader(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
                .build();
    }

    public DefaultGroqClient(GroqProperties properties, RestClient restClient, ObjectMapper objectMapper) {
        this.properties = properties;
        this.restClient = restClient;
        this.objectMapper = objectMapper;
    }

    @Override
    public GroqChatResponse chatCompletion(GroqChatRequest request) {
        if (!properties.isEnabled()) {
            throw new GroqUnavailableException("Groq AI service is not configured or currently disabled.");
        }

        if (Thread.currentThread().isInterrupted()) {
            throw new GroqApiException("Groq AI request cancelled: thread was interrupted before execution");
        }

        String apiKey = properties.getApiKey();
        int timeoutSeconds = properties.getTimeoutSeconds() > 0 ? properties.getTimeoutSeconds() : 15;
        int maxRetries = Math.max(0, properties.getMaxRetries());
        long maxTotalBudgetMs = (long) timeoutSeconds * 1000L * (maxRetries + 1);
        long deadline = System.currentTimeMillis() + maxTotalBudgetMs;
        long currentBackoffMs = INITIAL_BACKOFF_MS;
        int attempt = 0;

        while (true) {
            attempt++;

            if (Thread.currentThread().isInterrupted()) {
                throw new GroqApiException("Groq AI request cancelled: thread interrupted");
            }

            if (System.currentTimeMillis() >= deadline) {
                throw new GroqUnavailableException("Groq AI request exceeded bounded total time budget of " + (timeoutSeconds * (maxRetries + 1)) + " seconds.");
            }

            try {
                return restClient.post()
                        .uri("/chat/completions")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + apiKey)
                        .body(request)
                        .retrieve()
                        .onStatus(HttpStatusCode::isError, (req, res) -> {
                            int statusCode = res.getStatusCode().value();
                            if (statusCode == 429) {
                                String retryAfter = res.getHeaders().getFirst("Retry-After");
                                throw new GroqRateLimitException("Groq AI rate limit reached. Please retry in a moment.", retryAfter);
                            }
                            if (statusCode >= 500) {
                                throw new GroqUnavailableException("Groq AI upstream provider temporarily unavailable (status " + statusCode + ")");
                            }
                            // Non-transient client errors (400, 401, 403, 404, 422, etc.)
                            throw new GroqApiException("Groq AI request failed with client error status: " + statusCode);
                        })
                        .body(GroqChatResponse.class);

            } catch (GroqRateLimitException e) {
                log.warn("Groq rate limit encountered on attempt {}/{}", attempt, maxRetries + 1);
                if (attempt <= maxRetries) {
                    long sleepMs = currentBackoffMs;
                    if (e.getRetryAfter() != null && !e.getRetryAfter().isBlank()) {
                        long parsed = parseRetryAfterMs(e.getRetryAfter());
                        if (parsed > 0) {
                            sleepMs = parsed;
                        }
                    }
                    sleepMs = Math.min(sleepMs, MAX_BACKOFF_MS);
                    if (System.currentTimeMillis() + sleepMs >= deadline) {
                        throw new GroqRateLimitException("Groq AI rate limit retry delay exceeds request time budget", e.getRetryAfter());
                    }
                    sleepBackoff(sleepMs);
                    currentBackoffMs = Math.min(currentBackoffMs * 2, MAX_BACKOFF_MS);
                    continue;
                }
                throw e;

            } catch (GroqUnavailableException e) {
                log.warn("Transient Groq upstream error on attempt {}/{}", attempt, maxRetries + 1);
                if (attempt <= maxRetries && System.currentTimeMillis() + currentBackoffMs < deadline) {
                    sleepBackoff(Math.min(currentBackoffMs, MAX_BACKOFF_MS));
                    currentBackoffMs = Math.min(currentBackoffMs * 2, MAX_BACKOFF_MS);
                    continue;
                }
                throw e;

            } catch (ResourceAccessException e) {
                log.warn("Transient Groq I/O error on attempt {}/{}: {}", attempt, maxRetries + 1, e.getClass().getSimpleName());
                if (attempt <= maxRetries && System.currentTimeMillis() + currentBackoffMs < deadline) {
                    sleepBackoff(Math.min(currentBackoffMs, MAX_BACKOFF_MS));
                    currentBackoffMs = Math.min(currentBackoffMs * 2, MAX_BACKOFF_MS);
                    continue;
                }
                throw new GroqUnavailableException("Groq AI service request timed out or connection was refused.", e);

            } catch (GroqApiException e) {
                // Non-transient: 4xx, bad requests, interrupted, etc. Never retry!
                log.warn("Non-transient Groq API error on attempt {}: {}", attempt, e.getMessage());
                throw e;

            } catch (Exception e) {
                log.error("Unexpected error invoking Groq AI API on attempt {}: {}", attempt, e.getClass().getSimpleName());
                throw new GroqApiException("Failed to communicate with AI intelligence provider.", e);
            }
        }
    }

    private long parseRetryAfterMs(String retryAfterHeader) {
        if (retryAfterHeader == null || retryAfterHeader.isBlank()) {
            return -1;
        }
        try {
            long seconds = Long.parseLong(retryAfterHeader.trim());
            if (seconds >= 0) {
                return seconds * 1000L;
            }
        } catch (NumberFormatException ignored) {
            try {
                ZonedDateTime date = ZonedDateTime.parse(retryAfterHeader.trim(), DateTimeFormatter.RFC_1123_DATE_TIME);
                long diff = Duration.between(Instant.now(), date.toInstant()).toMillis();
                if (diff > 0) {
                    return diff;
                }
            } catch (Exception ignoredDate) {}
        }
        return -1;
    }

    private void sleepBackoff(long ms) {
        try {
            Thread.sleep(ms);
        } catch (InterruptedException ie) {
            Thread.currentThread().interrupt();
            throw new GroqApiException("Groq AI request interrupted during retry backoff", ie);
        }
    }
}
