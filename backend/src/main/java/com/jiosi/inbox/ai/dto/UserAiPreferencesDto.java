package com.jiosi.inbox.ai.dto;

public record UserAiPreferencesDto(
        boolean aiProcessingConsent,
        String defaultReplyTone,
        String defaultReplyLanguage,
        boolean serviceConfigured
) {}

