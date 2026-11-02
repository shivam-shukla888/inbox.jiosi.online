package com.jiosi.inbox.email.dto;

public record UpdateSnoozeRequest(
    boolean snoozed,
    String snoozedUntil
) {}
