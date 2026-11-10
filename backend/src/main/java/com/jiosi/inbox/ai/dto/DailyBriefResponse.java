package com.jiosi.inbox.ai.dto;

import java.util.List;

public record DailyBriefResponse(
        String briefDate,
        String generatedAt,
        String businessProfile,
        String summaryMessage,
        List<DailyBriefItemDto> needsYouToday,
        List<DailyBriefItemDto> waitingOnSomeoneElse,
        List<DailyBriefItemDto> promisesYouMade,
        List<DailyBriefItemDto> importantNotUrgent,
        List<DailyBriefItemDto> newslettersBulk,
        List<DailyBriefItemDto> possibleSpamOrSuspicious,
        boolean hasHighConfidenceItems
) {}
