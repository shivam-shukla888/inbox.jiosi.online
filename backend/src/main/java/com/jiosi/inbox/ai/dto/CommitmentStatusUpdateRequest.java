package com.jiosi.inbox.ai.dto;

import jakarta.validation.constraints.NotBlank;

public record CommitmentStatusUpdateRequest(
        @NotBlank(message = "Status cannot be blank")
        String status,
        String auditNote
) {}

