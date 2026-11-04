package com.jiosi.inbox.gmail.dto;

import java.util.List;

public record GmailMessagesPageResponse(
        List<GmailMessageSummary> messages,
        String nextPageToken,
        int resultSizeEstimate
) {}

