package com.jiosi.inbox.ai;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.jiosi.inbox.ai.client.DefaultGroqClient;
import com.jiosi.inbox.ai.client.GroqClient;
import com.jiosi.inbox.ai.config.GroqProperties;
import com.jiosi.inbox.ai.dto.GroqChatRequest;
import com.jiosi.inbox.ai.dto.GroqChatResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.RestClient;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.*;
import static org.springframework.test.web.client.response.MockRestResponseCreators.*;

class GroqClientTests {

    private GroqProperties properties;
    private RestClient.Builder restClientBuilder;
    private MockRestServiceServer mockServer;
    private ObjectMapper objectMapper;
    private GroqClient groqClient;

    @BeforeEach
    void setUp() {
        properties = new GroqProperties();
        properties.setApiKey("gsk_test_api_key_valid_mock");
        properties.setBaseUrl("https://api.groq.com/openai/v1");
        properties.setTimeoutSeconds(5);
        properties.setMaxRetries(1);
        properties.setEnabled(true);

        objectMapper = new ObjectMapper();
        restClientBuilder = RestClient.builder();
        mockServer = MockRestServiceServer.bindTo(restClientBuilder).build();

        groqClient = new DefaultGroqClient(properties, restClientBuilder, objectMapper);
    }

    @Test
    @DisplayName("chatCompletion succeeds with valid 200 JSON response")
    void testChatCompletionSuccess() {
        String mockResponseBody = """
                {
                  "id": "chatcmpl-test-123",
                  "model": "llama-3.3-70b-versatile",
                  "choices": [
                    {
                      "index": 0,
                      "message": {
                        "role": "assistant",
                        "content": "{\\"gist\\": \\"Team aligned on launch schedule.\\"}"
                      },
                      "finish_reason": "stop"
                    }
                  ],
                  "usage": {
                    "prompt_tokens": 120,
                    "completion_tokens": 25,
                    "total_tokens": 145
                  }
                }
                """;

        mockServer.expect(requestTo("https://api.groq.com/openai/v1/chat/completions"))
                .andExpect(method(HttpMethod.POST))
                .andExpect(header(HttpHeaders.AUTHORIZATION, "Bearer gsk_test_api_key_valid_mock"))
                .andRespond(withSuccess(mockResponseBody, MediaType.APPLICATION_JSON));

        GroqChatRequest request = GroqChatRequest.jsonRequest(
                "llama-3.3-70b-versatile",
                List.of(new GroqChatRequest.Message("user", "Summarize email")),
                0.1,
                500
        );

        GroqChatResponse response = groqClient.chatCompletion(request);
        assertThat(response).isNotNull();
        assertThat(response.id()).isEqualTo("chatcmpl-test-123");
        assertThat(response.firstChoiceContent()).contains("Team aligned on launch schedule.");
        mockServer.verify();
    }

    @Test
    @DisplayName("chatCompletion handles 429 rate limit and retries before throwing GroqRateLimitException")
    void testChatCompletionRateLimit() {
        mockServer.expect(requestTo("https://api.groq.com/openai/v1/chat/completions"))
                .andExpect(method(HttpMethod.POST))
                .andRespond(withStatus(HttpStatus.TOO_MANY_REQUESTS)
                        .header("Retry-After", "3")
                        .body("Rate limit reached"));

        mockServer.expect(requestTo("https://api.groq.com/openai/v1/chat/completions"))
                .andExpect(method(HttpMethod.POST))
                .andRespond(withStatus(HttpStatus.TOO_MANY_REQUESTS)
                        .header("Retry-After", "3")
                        .body("Rate limit reached"));

        GroqChatRequest request = GroqChatRequest.jsonRequest(
                "llama-3.3-70b-versatile",
                List.of(new GroqChatRequest.Message("user", "Summarize email")),
                0.1,
                500
        );

        assertThatThrownBy(() -> groqClient.chatCompletion(request))
                .isInstanceOf(GroqClient.GroqRateLimitException.class)
                .hasMessageContaining("rate limit");
        mockServer.verify();
    }

    @Test
    @DisplayName("chatCompletion handles 503 provider unavailable")
    void testChatCompletionServiceUnavailable() {
        mockServer.expect(requestTo("https://api.groq.com/openai/v1/chat/completions"))
                .andExpect(method(HttpMethod.POST))
                .andRespond(withStatus(HttpStatus.SERVICE_UNAVAILABLE).body("Service down"));

        mockServer.expect(requestTo("https://api.groq.com/openai/v1/chat/completions"))
                .andExpect(method(HttpMethod.POST))
                .andRespond(withStatus(HttpStatus.SERVICE_UNAVAILABLE).body("Service down"));

        GroqChatRequest request = GroqChatRequest.jsonRequest(
                "llama-3.3-70b-versatile",
                List.of(new GroqChatRequest.Message("user", "Summarize email")),
                0.1,
                500
        );

        assertThatThrownBy(() -> groqClient.chatCompletion(request))
                .isInstanceOf(GroqClient.GroqUnavailableException.class)
                .hasMessageContaining("temporarily unavailable");
        mockServer.verify();
    }

    @Test
    @DisplayName("Throws GroqUnavailableException when service is disabled or API key missing")
    void testServiceDisabled() {
        properties.setApiKey(null);
        properties.setEnabled(false);

        GroqChatRequest request = GroqChatRequest.jsonRequest(
                "llama-3.3-70b-versatile",
                List.of(new GroqChatRequest.Message("user", "Summarize email")),
                0.1,
                500
        );

        assertThatThrownBy(() -> groqClient.chatCompletion(request))
                .isInstanceOf(GroqClient.GroqUnavailableException.class)
                .hasMessageContaining("not configured or currently disabled");
    }
}

