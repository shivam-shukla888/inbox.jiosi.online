package com.jiosi.inbox.ai.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;

import java.util.List;
import java.util.Map;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record GroqChatRequest(
        String model,
        List<Message> messages,
        Double temperature,
        @JsonProperty("max_tokens") Integer maxTokens,
        @JsonProperty("response_format") Map<String, String> responseFormat
) {
    public record Message(String role, String content) {}

    public static GroqChatRequest jsonRequest(String model, List<Message> messages, Double temperature, Integer maxTokens) {
        return new GroqChatRequest(
                model,
                messages,
                temperature,
                maxTokens,
                Map.of("type", "json_object")
        );
    }

    public static GroqChatRequest textRequest(String model, List<Message> messages, Double temperature, Integer maxTokens) {
        return new GroqChatRequest(
                model,
                messages,
                temperature,
                maxTokens,
                null
        );
    }
}

