package com.jiosi.inbox.ai;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.jiosi.inbox.ai.dto.UserBusinessProfileDto;
import com.jiosi.inbox.ai.entity.UserBusinessProfile;
import com.jiosi.inbox.ai.repository.UserBusinessProfileRepository;
import com.jiosi.inbox.ai.service.BusinessProfileService;
import com.jiosi.inbox.security.WorkspaceAuthorizationService;
import com.jiosi.inbox.user.User;
import com.jiosi.inbox.workspace.Workspace;
import com.jiosi.inbox.workspace.WorkspaceRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class BusinessProfileServiceTests {

    @Mock
    private UserBusinessProfileRepository profileRepository;

    @Mock
    private WorkspaceRepository workspaceRepository;

    @Mock
    private WorkspaceAuthorizationService workspaceAuthService;

    private ObjectMapper objectMapper;
    private BusinessProfileService service;

    private User testUser;
    private Workspace testWorkspace;
    private UUID workspaceId;

    @BeforeEach
    void setUp() {
        objectMapper = new ObjectMapper();
        service = new BusinessProfileService(profileRepository, workspaceRepository, workspaceAuthService, objectMapper);

        workspaceId = UUID.randomUUID();
        testUser = new User();
        testUser.setId(UUID.randomUUID());
        testUser.setEmail("owner@agency.com");

        testWorkspace = new Workspace();
        testWorkspace.setId(workspaceId);
        testWorkspace.setName("Creative Agency WS");
    }

    @Test
    @DisplayName("getOrCreateProfile returns existing profile if present")
    void testGetOrCreateProfileExisting() {
        UserBusinessProfile existing = new UserBusinessProfile(testUser.getId(), testWorkspace, "freelancer_agency");
        when(profileRepository.findByUserIdAndWorkspaceId(testUser.getId(), workspaceId)).thenReturn(Optional.of(existing));

        UserBusinessProfile result = service.getOrCreateProfile(testUser, workspaceId);

        assertThat(result).isNotNull();
        assertThat(result.getProfileType()).isEqualTo("freelancer_agency");
        verify(profileRepository, never()).save(any());
    }

    @Test
    @DisplayName("getOrCreateProfile initializes generic profile with sensible defaults if missing")
    void testGetOrCreateProfileInitializesDefault() {
        when(profileRepository.findByUserIdAndWorkspaceId(testUser.getId(), workspaceId)).thenReturn(Optional.empty());
        when(workspaceRepository.findById(workspaceId)).thenReturn(Optional.of(testWorkspace));
        when(profileRepository.save(any(UserBusinessProfile.class))).thenAnswer(invocation -> invocation.getArgument(0));

        UserBusinessProfile result = service.getOrCreateProfile(testUser, workspaceId);

        assertThat(result).isNotNull();
        assertThat(result.getProfileType()).isEqualTo("generic");
        assertThat(result.getTimezone()).isEqualTo("UTC");
        assertThat(result.getBusinessHoursStart()).isEqualTo("09:00");
        assertThat(result.getBusinessHoursEnd()).isEqualTo("18:00");
        assertThat(result.isQuietHoursEnabled()).isTrue();
    }

    @Test
    @DisplayName("updateProfile updates profile type and VIP contacts")
    void testUpdateProfile() {
        UserBusinessProfile profile = new UserBusinessProfile(testUser.getId(), testWorkspace, "generic");
        when(profileRepository.findByUserIdAndWorkspaceId(testUser.getId(), workspaceId)).thenReturn(Optional.of(profile));
        when(profileRepository.save(any(UserBusinessProfile.class))).thenAnswer(invocation -> invocation.getArgument(0));

        UserBusinessProfileDto updateDto = new UserBusinessProfileDto(
                "freelancer_agency",
                "Studio Acme",
                "Asia/Kolkata",
                "10:00",
                "19:00",
                true,
                "21:00",
                "09:00",
                List.of("client@acme.com", "@keypartner.com"),
                List.of("vendor@supplier.com"),
                "08:30",
                "en"
        );

        UserBusinessProfileDto saved = service.updateProfile(testUser, workspaceId, updateDto);

        assertThat(saved.profileType()).isEqualTo("freelancer_agency");
        assertThat(saved.businessName()).isEqualTo("Studio Acme");
        assertThat(saved.timezone()).isEqualTo("Asia/Kolkata");
        assertThat(saved.vipContacts()).containsExactly("client@acme.com", "@keypartner.com");
    }

    @Test
    @DisplayName("isVipContact correctly identifies exact emails and domain wildcards")
    void testIsVipContact() {
        UserBusinessProfile profile = new UserBusinessProfile(testUser.getId(), testWorkspace, "generic");
        profile.setVipContacts("[\"ceo@bigclient.com\", \"@keycorp.com\"]");

        assertThat(service.isVipContact("ceo@bigclient.com", profile)).isTrue();
        assertThat(service.isVipContact("CEO@BIGCLIENT.COM", profile)).isTrue(); // Case insensitive
        assertThat(service.isVipContact("lead@keycorp.com", profile)).isTrue(); // Domain wildcard
        assertThat(service.isVipContact("random@other.com", profile)).isFalse();
        assertThat(service.isVipContact(null, profile)).isFalse();
    }

    @Test
    @DisplayName("isInQuietHours accurately evaluates windows spanning midnight")
    void testIsInQuietHoursSpanningMidnight() {
        UserBusinessProfile profile = new UserBusinessProfile(testUser.getId(), testWorkspace, "generic");
        profile.setTimezone("UTC");
        profile.setQuietHoursEnabled(true);
        profile.setQuietHoursStart("22:00");
        profile.setQuietHoursEnd("07:00");

        // 23:30 UTC -> inside quiet hours
        ZonedDateTime nightTime = ZonedDateTime.of(2026, 11, 10, 23, 30, 0, 0, ZoneId.of("UTC"));
        assertThat(service.isInQuietHours(profile, nightTime)).isTrue();

        // 04:15 UTC -> inside quiet hours
        ZonedDateTime earlyMorning = ZonedDateTime.of(2026, 11, 11, 4, 15, 0, 0, ZoneId.of("UTC"));
        assertThat(service.isInQuietHours(profile, earlyMorning)).isTrue();

        // 14:00 UTC -> during business hours (outside quiet hours)
        ZonedDateTime dayTime = ZonedDateTime.of(2026, 11, 11, 14, 0, 0, 0, ZoneId.of("UTC"));
        assertThat(service.isInQuietHours(profile, dayTime)).isFalse();
    }
}
