package com.jiosi.inbox.ai.dto;

public record ReplyDraftResponse(
        String draftText,
        String tone,
        String language
) {}

