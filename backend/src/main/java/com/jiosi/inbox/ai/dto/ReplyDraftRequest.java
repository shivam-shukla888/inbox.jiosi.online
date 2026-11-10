package com.jiosi.inbox.ai.dto;

import jakarta.validation.constraints.NotNull;

public record ReplyDraftRequest(
        @NotNull(message = "Tone is required") String tone,
        String language,
        String customInstructions
) {
    public ReplyDraftRequest {
        if (tone == null || tone.isBlank()) {
            tone = "professional";
        }
        if (language == null || language.isBlank()) {
            language = "match_thread";
        }
    }
}

