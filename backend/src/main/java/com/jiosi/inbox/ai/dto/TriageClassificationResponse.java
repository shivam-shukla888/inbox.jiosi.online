package com.jiosi.inbox.ai.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import java.util.List;

@JsonIgnoreProperties(ignoreUnknown = true)
public record TriageClassificationResponse(
        String category,
        int importanceScore,
        String importanceReason,
        int urgencyScore,
        String urgencyReason,
        boolean needsReply,
        String deadline,
        List<String> evidence,
        double confidence,
        String userOverrideCategory
) {
    public TriageClassificationResponse {
        if (evidence == null) {
            evidence = List.of();
        }
    }
}

