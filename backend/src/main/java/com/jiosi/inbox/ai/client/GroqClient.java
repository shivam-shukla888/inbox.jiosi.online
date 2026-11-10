package com.jiosi.inbox.ai.client;

import com.jiosi.inbox.ai.dto.GroqChatRequest;
import com.jiosi.inbox.ai.dto.GroqChatResponse;

public interface GroqClient {

    GroqChatResponse chatCompletion(GroqChatRequest request);

    class GroqApiException extends RuntimeException {
        public GroqApiException(String message) { super(message); }
        public GroqApiException(String message, Throwable cause) { super(message, cause); }
    }

    class GroqRateLimitException extends RuntimeException {
        private final String retryAfter;
        public GroqRateLimitException(String message, String retryAfter) {
            super(message);
            this.retryAfter = retryAfter;
        }
        public String getRetryAfter() { return retryAfter; }
    }

    class GroqUnavailableException extends RuntimeException {
        public GroqUnavailableException(String message) { super(message); }
        public GroqUnavailableException(String message, Throwable cause) { super(message, cause); }
    }
}
