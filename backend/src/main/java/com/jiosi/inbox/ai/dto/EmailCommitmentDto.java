package com.jiosi.inbox.ai.dto;

import java.util.UUID;

public record EmailCommitmentDto(
        UUID id,
        UUID threadId,
        String threadSubject,
        String sourceMessageId,
        String actor,
        String action,
        String target,
        String dueDate,
        String evidenceQuote,
        String status,
        String userStatusOverride,
        String effectiveStatus,
        String auditNote,
        double confidence,
        String createdAt
) {}
