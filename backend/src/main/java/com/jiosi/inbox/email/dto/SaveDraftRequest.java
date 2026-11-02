package com.jiosi.inbox.email.dto;

import java.util.UUID;

public record SaveDraftRequest(
    UUID draftId,
    UUID threadId,
    String toEmail,
    String recipientName,
    String subject,
    String body
) {}
