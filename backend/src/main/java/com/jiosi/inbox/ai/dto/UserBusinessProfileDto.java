package com.jiosi.inbox.ai.dto;

import java.util.List;

public record UserBusinessProfileDto(
        String profileType,
        String businessName,
        String timezone,
        String businessHoursStart,
        String businessHoursEnd,
        boolean quietHoursEnabled,
        String quietHoursStart,
        String quietHoursEnd,
        List<String> vipContacts,
        List<String> waitingOnContacts,
        String dailyBriefTime,
        String summaryLanguage
) {}

