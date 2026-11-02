package com.jiosi.inbox.email.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public record SendEmailRequest(
    @NotBlank(message = "Recipient email is required")
    @Email(message = "Recipient email must be a valid email format")
    String toEmail,

    @NotBlank(message = "Subject must not be blank")
    String subject,

    @NotBlank(message = "Email body must not be blank")
    String body
) {}
