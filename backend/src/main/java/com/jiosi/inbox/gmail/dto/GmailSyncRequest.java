package com.jiosi.inbox.gmail.dto;

public record GmailSyncRequest(
        Integer maxResults,
        String pageToken
) {}

