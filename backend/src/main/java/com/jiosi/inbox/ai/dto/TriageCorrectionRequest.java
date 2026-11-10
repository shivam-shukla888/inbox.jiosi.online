package com.jiosi.inbox.ai.dto;

import jakarta.validation.constraints.NotBlank;

public record TriageCorrectionRequest(
        @NotBlank(message = "Corrected category is required") String correctedCategory,
        String feedbackNotes,
        boolean isFalsePositive
) {}

