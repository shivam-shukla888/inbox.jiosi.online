package com.jiosi.inbox.ai.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import java.util.List;

@JsonIgnoreProperties(ignoreUnknown = true)
public record ActionItemDto(
        String title,
        String owner,
        String dueDate,
        String evidenceQuote,
        double confidence
) {
    public record ActionItemsList(List<ActionItemDto> items) {
        public ActionItemsList {
            if (items == null) {
                items = List.of();
            }
        }
    }
}

