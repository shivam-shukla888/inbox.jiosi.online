package com.jiosi.inbox.gmail.dto;

public record GmailSyncResponse(
        int syncedCount,
        int newMessagesCount,
        int existingMessagesCount,
        int failedMessagesCount,
        String nextPageToken,
        int resultSizeEstimate
) {}

