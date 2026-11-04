package com.jiosi.inbox.gmail.dto;

import java.time.Instant;
import java.util.List;

public record GmailMessageDetail(
        String id,
        String threadId,
        String subject,
        String senderName,
        String senderEmail,
        String recipientEmail,
        String cc,
        String snippet,
        String bodyText,
        String bodyHtml,
        Instant receivedAt,
        boolean isUnread,
        boolean isStarred,
        boolean hasAttachments,
        List<String> labelIds
) {}

