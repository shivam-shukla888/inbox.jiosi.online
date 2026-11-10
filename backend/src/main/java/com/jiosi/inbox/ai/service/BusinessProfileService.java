package com.jiosi.inbox.ai.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.jiosi.inbox.ai.dto.UserBusinessProfileDto;
import com.jiosi.inbox.ai.entity.UserBusinessProfile;
import com.jiosi.inbox.ai.repository.UserBusinessProfileRepository;
import com.jiosi.inbox.common.ResourceNotFoundException;
import com.jiosi.inbox.security.WorkspaceAuthorizationService;
import com.jiosi.inbox.user.User;
import com.jiosi.inbox.workspace.Workspace;
import com.jiosi.inbox.workspace.WorkspaceRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalTime;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.time.format.DateTimeParseException;
import java.util.*;

@Service
public class BusinessProfileService {

    private static final Logger log = LoggerFactory.getLogger(BusinessProfileService.class);

    public static final Set<String> SUPPORTED_PROFILES = Set.of(
            "generic",
            "freelancer_agency",
            "local_service",
            "retail_ecommerce",
            "professional_services",
            "small_saas"
    );

    private final UserBusinessProfileRepository profileRepository;
    private final WorkspaceRepository workspaceRepository;
    private final WorkspaceAuthorizationService workspaceAuthService;
    private final ObjectMapper objectMapper;

    public BusinessProfileService(
            UserBusinessProfileRepository profileRepository,
            WorkspaceRepository workspaceRepository,
            WorkspaceAuthorizationService workspaceAuthService,
            ObjectMapper objectMapper
    ) {
        this.profileRepository = profileRepository;
        this.workspaceRepository = workspaceRepository;
        this.workspaceAuthService = workspaceAuthService;
        this.objectMapper = objectMapper;
    }

    /**
     * Retrieves the business profile for a user in a workspace, initializing sensible defaults if not yet created.
     */
    @Transactional
    public UserBusinessProfile getOrCreateProfile(User user, UUID workspaceId) {
        workspaceAuthService.validateAccess(workspaceId, user);

        return profileRepository.findByUserIdAndWorkspaceId(user.getId(), workspaceId)
                .orElseGet(() -> {
                    Workspace workspace = workspaceRepository.findById(workspaceId)
                            .orElseThrow(() -> new ResourceNotFoundException("Workspace not found: " + workspaceId));
                    UserBusinessProfile newProfile = new UserBusinessProfile(user.getId(), workspace, "generic");
                    return profileRepository.save(newProfile);
                });
    }

    /**
     * Converts an entity to its DTO representation.
     */
    public UserBusinessProfileDto toDto(UserBusinessProfile profile) {
        List<String> vipList = parseStringList(profile.getVipContacts());
        List<String> waitingList = parseStringList(profile.getWaitingOnContacts());

        return new UserBusinessProfileDto(
                profile.getProfileType(),
                profile.getBusinessName(),
                profile.getTimezone(),
                profile.getBusinessHoursStart(),
                profile.getBusinessHoursEnd(),
                profile.isQuietHoursEnabled(),
                profile.getQuietHoursStart(),
                profile.getQuietHoursEnd(),
                vipList,
                waitingList,
                profile.getDailyBriefTime(),
                profile.getSummaryLanguage()
        );
    }

    /**
     * Updates the user's business profile with progressive configuration.
     */
    @Transactional
    public UserBusinessProfileDto updateProfile(User user, UUID workspaceId, UserBusinessProfileDto dto) {
        workspaceAuthService.validateAccess(workspaceId, user);

        UserBusinessProfile profile = getOrCreateProfile(user, workspaceId);

        if (dto.profileType() != null && SUPPORTED_PROFILES.contains(dto.profileType().toLowerCase(Locale.ROOT))) {
            profile.setProfileType(dto.profileType().toLowerCase(Locale.ROOT));
        }
        if (dto.businessName() != null) {
            profile.setBusinessName(dto.businessName().trim());
        }
        if (dto.timezone() != null && isValidTimezone(dto.timezone())) {
            profile.setTimezone(dto.timezone().trim());
        }
        if (dto.businessHoursStart() != null) {
            profile.setBusinessHoursStart(dto.businessHoursStart().trim());
        }
        if (dto.businessHoursEnd() != null) {
            profile.setBusinessHoursEnd(dto.businessHoursEnd().trim());
        }
        profile.setQuietHoursEnabled(dto.quietHoursEnabled());
        if (dto.quietHoursStart() != null) {
            profile.setQuietHoursStart(dto.quietHoursStart().trim());
        }
        if (dto.quietHoursEnd() != null) {
            profile.setQuietHoursEnd(dto.quietHoursEnd().trim());
        }
        if (dto.vipContacts() != null) {
            profile.setVipContacts(writeStringList(dto.vipContacts()));
        }
        if (dto.waitingOnContacts() != null) {
            profile.setWaitingOnContacts(writeStringList(dto.waitingOnContacts()));
        }
        if (dto.dailyBriefTime() != null) {
            profile.setDailyBriefTime(dto.dailyBriefTime().trim());
        }
        if (dto.summaryLanguage() != null) {
            profile.setSummaryLanguage(dto.summaryLanguage().trim());
        }

        UserBusinessProfile saved = profileRepository.save(profile);
        return toDto(saved);
    }

    /**
     * Checks if a given sender email or domain is configured as a VIP contact.
     */
    public boolean isVipContact(String senderEmail, UserBusinessProfile profile) {
        if (senderEmail == null || profile == null) return false;
        String emailLower = senderEmail.toLowerCase(Locale.ROOT).trim();
        List<String> vips = parseStringList(profile.getVipContacts());

        for (String vip : vips) {
            String v = vip.toLowerCase(Locale.ROOT).trim();
            if (v.startsWith("@")) {
                if (emailLower.endsWith(v)) return true;
            } else {
                if (emailLower.equalsIgnoreCase(v)) return true;
            }
        }
        return false;
    }

    /**
     * Checks if the current time in user's timezone is within quiet hours.
     */
    public boolean isInQuietHours(UserBusinessProfile profile, ZonedDateTime now) {
        if (!profile.isQuietHoursEnabled()) return false;
        try {
            ZoneId zoneId = ZoneId.of(profile.getTimezone());
            ZonedDateTime localTime = now.withZoneSameInstant(zoneId);
            LocalTime current = localTime.toLocalTime();
            LocalTime start = LocalTime.parse(profile.getQuietHoursStart());
            LocalTime end = LocalTime.parse(profile.getQuietHoursEnd());

            if (start.isBefore(end)) {
                return !current.isBefore(start) && current.isBefore(end);
            } else {
                // Spans midnight, e.g. 20:00 to 08:00
                return !current.isBefore(start) || current.isBefore(end);
            }
        } catch (Exception e) {
            return false;
        }
    }

    public List<String> parseStringList(String json) {
        if (json == null || json.isBlank()) return new ArrayList<>();
        try {
            return objectMapper.readValue(json, new TypeReference<>() {});
        } catch (Exception e) {
            return new ArrayList<>();
        }
    }

    private String writeStringList(List<String> list) {
        if (list == null) return "[]";
        try {
            return objectMapper.writeValueAsString(list);
        } catch (Exception e) {
            return "[]";
        }
    }

    private boolean isValidTimezone(String tz) {
        try {
            ZoneId.of(tz);
            return true;
        } catch (Exception e) {
            return false;
        }
    }
}
