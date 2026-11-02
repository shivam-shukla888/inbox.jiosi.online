package com.jiosi.inbox.email.dto;

import jakarta.validation.constraints.NotBlank;

public record SendReplyRequest(
    @NotBlank(message = "Reply body must not be blank")
    String body,
    String toEmail
) {}
