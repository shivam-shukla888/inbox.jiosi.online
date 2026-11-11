package com.jiosi.inbox.ai.entity;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(
    name = "user_ai_preferences",
    uniqueConstraints = {
        @UniqueConstraint(name = "uq_user_ai_preferences_user", columnNames = {"user_id"})
    }
)
public class UserAiPreferences {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Column(name = "ai_processing_consent", nullable = false)
    private boolean aiProcessingConsent = false;

    @Column(name = "default_reply_tone", nullable = false, length = 32)
    private String defaultReplyTone = "professional";

    @Column(name = "default_reply_language", nullable = false, length = 32)
    private String defaultReplyLanguage = "match_thread";

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    public UserAiPreferences() {}

    public UserAiPreferences(UUID userId, boolean aiProcessingConsent, String defaultReplyTone, String defaultReplyLanguage) {
        this.userId = userId;
        this.aiProcessingConsent = aiProcessingConsent;
        this.defaultReplyTone = defaultReplyTone != null ? defaultReplyTone : "professional";
        this.defaultReplyLanguage = defaultReplyLanguage != null ? defaultReplyLanguage : "match_thread";
    }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public UUID getUserId() { return userId; }
    public void setUserId(UUID userId) { this.userId = userId; }

    public boolean isAiProcessingConsent() { return aiProcessingConsent; }
    public void setAiProcessingConsent(boolean aiProcessingConsent) { this.aiProcessingConsent = aiProcessingConsent; }

    public String getDefaultReplyTone() { return defaultReplyTone; }
    public void setDefaultReplyTone(String defaultReplyTone) { this.defaultReplyTone = defaultReplyTone; }

    public String getDefaultReplyLanguage() { return defaultReplyLanguage; }
    public void setDefaultReplyLanguage(String defaultReplyLanguage) { this.defaultReplyLanguage = defaultReplyLanguage; }

    public Instant getCreatedAt() { return createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
}
