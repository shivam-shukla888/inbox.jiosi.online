package com.jiosi.inbox.ai.dto;

public record ComposeAssistResponse(
        String originalText,
        String suggestedText,
        String action,
        String explanation
) {}

