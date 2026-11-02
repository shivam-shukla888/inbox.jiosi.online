package com.jiosi.inbox.email.dto;

import java.util.List;

public record ThreadSummaryDto(
    String id,
    SenderDto sender,
    RecipientDto recipient,
    List<String> cc,
    List<String> bcc,
    String subject,
    String snippet,
    String body,
    String timestamp,
    String date,
    boolean isUnread,
    boolean isStarred,
    boolean isNeedsReply,
    boolean isSnoozed,
    String snoozedUntil,
    boolean isArchived,
    boolean isSent,
    boolean isDraft,
    String lastEdited,
    List<String> tags,
    List<AttachmentSummaryDto> attachments,
    String aiSummary,
    List<String> actionItems,
    int messageCount
) {}
