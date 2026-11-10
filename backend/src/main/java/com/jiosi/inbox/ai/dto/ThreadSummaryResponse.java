package com.jiosi.inbox.ai.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import java.util.List;

@JsonIgnoreProperties(ignoreUnknown = true)
public record ThreadSummaryResponse(
        String gist,
        List<String> keyDecisions,
        String openQuestion,
        String explicitDeadline,
        String suggestedNextAction
) {
    public ThreadSummaryResponse {
        if (keyDecisions == null) {
            keyDecisions = List.of();
        }
    }
}

