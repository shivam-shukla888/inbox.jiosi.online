package com.jiosi.inbox.gmail.dto;

import java.time.Instant;
import java.util.List;

public record GmailMessageSummary(
        String id,
        String threadId,
        String subject,
        String senderName,
        String senderEmail,
        String recipientEmail,
        String snippet,
        Instant receivedAt,
        boolean isUnread,
        boolean isStarred,
        List<String> labelIds
) {}

