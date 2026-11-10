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

@Component
public class DefaultGroqClient implements GroqClient {

    private static final Logger log = LoggerFactory.getLogger(DefaultGroqClient.class);

    private final GroqProperties properties;
    private final RestClient restClient;
    private final ObjectMapper objectMapper;

    @org.springframework.beans.factory.annotation.Autowired
    public DefaultGroqClient(GroqProperties properties, RestClient.Builder restClientBuilder, ObjectMapper objectMapper) {
        this.properties = properties;
        this.objectMapper = objectMapper;

        // Configure baseUrl and default headers
        this.restClient = restClientBuilder
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

        String apiKey = properties.getApiKey();
        int maxRetries = Math.max(0, properties.getMaxRetries());
        int attempt = 0;
        long backoffMs = 500;

        while (true) {
            attempt++;
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
                            throw new GroqApiException("Groq AI request failed with status: " + statusCode);
                        })
                        .body(GroqChatResponse.class);

            } catch (GroqRateLimitException e) {
                log.warn("Groq rate limit encountered on attempt {}/{}", attempt, maxRetries + 1);
                if (attempt <= maxRetries) {
                    sleepBackoff(backoffMs);
                    backoffMs *= 2;
                    continue;
                }
                throw e;
            } catch (GroqUnavailableException | ResourceAccessException e) {
                log.warn("Transient Groq connection error on attempt {}/{}: {}", attempt, maxRetries + 1, e.getMessage());
                if (attempt <= maxRetries) {
                    sleepBackoff(backoffMs);
                    backoffMs *= 2;
                    continue;
                }
                throw new GroqUnavailableException("Groq AI service connection timed out or is temporarily unavailable.", e);
            } catch (Exception e) {
                if (e instanceof GroqApiException || e instanceof GroqRateLimitException || e instanceof GroqUnavailableException) {
                    throw e;
                }
                log.error("Unexpected error invoking Groq AI API on attempt {}", attempt);
                throw new GroqApiException("Failed to communicate with AI intelligence provider.", e);
            }
        }
    }

    private void sleepBackoff(long ms) {
        try {
            Thread.sleep(ms);
        } catch (InterruptedException ie) {
            Thread.currentThread().interrupt();
            throw new GroqApiException("AI request interrupted during retry backoff", ie);
        }
    }
}
