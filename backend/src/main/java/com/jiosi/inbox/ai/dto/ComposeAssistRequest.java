package com.jiosi.inbox.ai.dto;

import jakarta.validation.constraints.NotBlank;

public record ComposeAssistRequest(
        @NotBlank(message = "Current text is required") String currentText,
        @NotBlank(message = "Action is required") String action,
        String targetLanguage,
        String instructions
) {
    public ComposeAssistRequest {
        if (action == null || action.isBlank()) {
            action = "rewrite";
        }
    }
}

