package com.jiosi.inbox.email.dto;

public record FolderCountsDto(
    FolderCountItem inbox,
    FolderCountItem needsReply,
    long starred,
    long snoozed,
    long sent,
    long drafts,
    long filterAll,
    long filterUnread,
    long filterNeedsReply,
    long filterVip
) {
    public record FolderCountItem(long total, long unread) {}
}
