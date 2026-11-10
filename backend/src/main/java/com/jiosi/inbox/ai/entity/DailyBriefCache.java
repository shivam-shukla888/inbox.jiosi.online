package com.jiosi.inbox.ai.entity;

import com.jiosi.inbox.workspace.Workspace;
import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(
    name = "daily_brief_cache",
    uniqueConstraints = {
        @UniqueConstraint(name = "uq_daily_brief_cache", columnNames = {"user_id", "workspace_id", "brief_date"})
    },
    indexes = {
        @Index(name = "idx_daily_brief_cache_ws", columnList = "workspace_id")
    }
)
public class DailyBriefCache {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "workspace_id", nullable = false)
    private Workspace workspace;

    @Column(name = "brief_date", nullable = false, length = 32)
    private String briefDate;

    @Column(name = "brief_json", nullable = false, columnDefinition = "TEXT")
    private String briefJson;

    @CreationTimestamp
    @Column(name = "generated_at", nullable = false)
    private Instant generatedAt;

    public DailyBriefCache() {}

    public DailyBriefCache(UUID userId, Workspace workspace, String briefDate, String briefJson) {
        this.userId = userId;
        this.workspace = workspace;
        this.briefDate = briefDate;
        this.briefJson = briefJson;
    }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public UUID getUserId() { return userId; }
    public void setUserId(UUID userId) { this.userId = userId; }

    public Workspace getWorkspace() { return workspace; }
    public void setWorkspace(Workspace workspace) { this.workspace = workspace; }

    public String getBriefDate() { return briefDate; }
    public void setBriefDate(String briefDate) { this.briefDate = briefDate; }

    public String getBriefJson() { return briefJson; }
    public void setBriefJson(String briefJson) { this.briefJson = briefJson; }

    public Instant getGeneratedAt() { return generatedAt; }
    public void setGeneratedAt(Instant generatedAt) { this.generatedAt = generatedAt; }
}

