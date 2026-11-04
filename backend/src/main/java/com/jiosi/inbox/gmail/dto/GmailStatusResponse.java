package com.jiosi.inbox.gmail.dto;

import java.time.Instant;
import java.util.UUID;

public record GmailStatusResponse(
        boolean connected,
        UUID accountId,
        String email,
        String provider,
        String status,
        Instant lastSyncAt,
        Instant tokenExpiresAt,
        String scope
) {}

