package com.jiosi.inbox.ai.entity;

import com.jiosi.inbox.workspace.Workspace;
import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(
    name = "user_business_profiles",
    uniqueConstraints = {
        @UniqueConstraint(name = "uq_user_business_profiles", columnNames = {"user_id", "workspace_id"})
    },
    indexes = {
        @Index(name = "idx_user_business_profiles_ws", columnList = "workspace_id")
    }
)
public class UserBusinessProfile {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "workspace_id", nullable = false)
    private Workspace workspace;

    @Column(name = "profile_type", nullable = false, length = 64)
    private String profileType = "generic";

    @Column(name = "business_name", length = 255)
    private String businessName;

    @Column(name = "timezone", nullable = false, length = 64)
    private String timezone = "UTC";

    @Column(name = "business_hours_start", nullable = false, length = 10)
    private String businessHoursStart = "09:00";

    @Column(name = "business_hours_end", nullable = false, length = 10)
    private String businessHoursEnd = "18:00";

    @Column(name = "quiet_hours_enabled", nullable = false)
    private boolean quietHoursEnabled = true;

    @Column(name = "quiet_hours_start", nullable = false, length = 10)
    private String quietHoursStart = "20:00";

    @Column(name = "quiet_hours_end", nullable = false, length = 10)
    private String quietHoursEnd = "08:00";

    @Column(name = "vip_contacts", columnDefinition = "TEXT")
    private String vipContacts = "[]";

    @Column(name = "waiting_on_contacts", columnDefinition = "TEXT")
    private String waitingOnContacts = "[]";

    @Column(name = "daily_brief_time", nullable = false, length = 10)
    private String dailyBriefTime = "08:30";

    @Column(name = "summary_language", nullable = false, length = 32)
    private String summaryLanguage = "match_thread";

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    public UserBusinessProfile() {}

    public UserBusinessProfile(UUID userId, Workspace workspace, String profileType) {
        this.userId = userId;
        this.workspace = workspace;
        this.profileType = profileType != null ? profileType : "generic";
    }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public UUID getUserId() { return userId; }
    public void setUserId(UUID userId) { this.userId = userId; }

    public Workspace getWorkspace() { return workspace; }
    public void setWorkspace(Workspace workspace) { this.workspace = workspace; }

    public String getProfileType() { return profileType; }
    public void setProfileType(String profileType) { this.profileType = profileType; }

    public String getBusinessName() { return businessName; }
    public void setBusinessName(String businessName) { this.businessName = businessName; }

    public String getTimezone() { return timezone; }
    public void setTimezone(String timezone) { this.timezone = timezone; }

    public String getBusinessHoursStart() { return businessHoursStart; }
    public void setBusinessHoursStart(String businessHoursStart) { this.businessHoursStart = businessHoursStart; }

    public String getBusinessHoursEnd() { return businessHoursEnd; }
    public void setBusinessHoursEnd(String businessHoursEnd) { this.businessHoursEnd = businessHoursEnd; }

    public boolean isQuietHoursEnabled() { return quietHoursEnabled; }
    public void setQuietHoursEnabled(boolean quietHoursEnabled) { this.quietHoursEnabled = quietHoursEnabled; }

    public String getQuietHoursStart() { return quietHoursStart; }
    public void setQuietHoursStart(String quietHoursStart) { this.quietHoursStart = quietHoursStart; }

    public String getQuietHoursEnd() { return quietHoursEnd; }
    public void setQuietHoursEnd(String quietHoursEnd) { this.quietHoursEnd = quietHoursEnd; }

    public String getVipContacts() { return vipContacts; }
    public void setVipContacts(String vipContacts) { this.vipContacts = vipContacts; }

    public String getWaitingOnContacts() { return waitingOnContacts; }
    public void setWaitingOnContacts(String waitingOnContacts) { this.waitingOnContacts = waitingOnContacts; }

    public String getDailyBriefTime() { return dailyBriefTime; }
    public void setDailyBriefTime(String dailyBriefTime) { this.dailyBriefTime = dailyBriefTime; }

    public String getSummaryLanguage() { return summaryLanguage; }
    public void setSummaryLanguage(String summaryLanguage) { this.summaryLanguage = summaryLanguage; }

    public Instant getCreatedAt() { return createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
}
