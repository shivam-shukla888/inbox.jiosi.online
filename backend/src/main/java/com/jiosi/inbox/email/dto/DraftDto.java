package com.jiosi.inbox.email.dto;

public record DraftDto(
    String id,
    String threadId,
    String toEmail,
    String recipientName,
    String subject,
    String body,
    String updatedAt
) {}
