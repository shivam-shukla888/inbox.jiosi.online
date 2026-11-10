package com.jiosi.inbox.ai.dto;

import java.util.UUID;

public record DailyBriefItemDto(
        UUID threadId,
        String externalThreadId,
        String subject,
        String senderName,
        String senderEmail,
        String briefReason,
        String explicitDeadline,
        String suggestedNextAction,
        String category,
        int importanceScore,
        int urgencyScore,
        String whoOwesNext, // "user", "other", "none"
        String lastMessageAt
) {}
