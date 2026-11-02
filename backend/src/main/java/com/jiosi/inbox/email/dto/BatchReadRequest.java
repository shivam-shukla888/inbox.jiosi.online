package com.jiosi.inbox.email.dto;

import jakarta.validation.constraints.NotEmpty;

import java.util.List;
import java.util.UUID;

public record BatchReadRequest(
    @NotEmpty(message = "threadIds must not be empty")
    List<UUID> threadIds,
    boolean unread
) {}
