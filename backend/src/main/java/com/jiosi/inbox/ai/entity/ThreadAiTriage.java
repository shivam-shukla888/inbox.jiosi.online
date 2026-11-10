package com.jiosi.inbox.ai.entity;

import com.jiosi.inbox.email.EmailThread;
import com.jiosi.inbox.workspace.Workspace;
import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(
    name = "thread_ai_triage",
    uniqueConstraints = {
        @UniqueConstraint(name = "uq_thread_ai_triage_thread", columnNames = {"thread_id"})
    },
    indexes = {
        @Index(name = "idx_thread_ai_triage_workspace", columnList = "workspace_id"),
        @Index(name = "idx_thread_ai_triage_category", columnList = "category"),
        @Index(name = "idx_thread_ai_triage_scores", columnList = "workspace_id, importance_score, urgency_score")
    }
)
public class ThreadAiTriage {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "thread_id", nullable = false)
    private EmailThread thread;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "workspace_id", nullable = false)
    private Workspace workspace;

    @Column(nullable = false, length = 32)
    private String category = "unknown";

    @Column(name = "user_category_override", length = 32)
    private String userCategoryOverride;

    @Column(name = "importance_score", nullable = false)
    private int importanceScore = 0;

    @Column(name = "importance_reason", length = 500)
    private String importanceReason;

    @Column(name = "urgency_score", nullable = false)
    private int urgencyScore = 0;

    @Column(name = "urgency_reason", length = 500)
    private String urgencyReason;

    @Column(name = "needs_reply", nullable = false)
    private boolean needsReply = false;

    @Column(name = "deadline")
    private Instant deadline;

    @Column(name = "evidence", columnDefinition = "TEXT")
    private String evidence;

    @Column(nullable = false)
    private double confidence = 0.0;

    @Column(name = "model_used", length = 100)
    private String modelUsed;

    @Column(name = "feedback_reported", nullable = false)
    private boolean feedbackReported = false;

    @Column(name = "feedback_notes", length = 500)
    private String feedbackNotes;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    public ThreadAiTriage() {}

    public ThreadAiTriage(EmailThread thread, Workspace workspace) {
        this.thread = thread;
        this.workspace = workspace;
    }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public EmailThread getThread() { return thread; }
    public void setThread(EmailThread thread) { this.thread = thread; }

    public Workspace getWorkspace() { return workspace; }
    public void setWorkspace(Workspace workspace) { this.workspace = workspace; }

    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }

    public String getUserCategoryOverride() { return userCategoryOverride; }
    public void setUserCategoryOverride(String userCategoryOverride) { this.userCategoryOverride = userCategoryOverride; }

    public int getImportanceScore() { return importanceScore; }
    public void setImportanceScore(int importanceScore) { this.importanceScore = importanceScore; }

    public String getImportanceReason() { return importanceReason; }
    public void setImportanceReason(String importanceReason) { this.importanceReason = importanceReason; }

    public int getUrgencyScore() { return urgencyScore; }
    public void setUrgencyScore(int urgencyScore) { this.urgencyScore = urgencyScore; }

    public String getUrgencyReason() { return urgencyReason; }
    public void setUrgencyReason(String urgencyReason) { this.urgencyReason = urgencyReason; }

    public boolean isNeedsReply() { return needsReply; }
    public void setNeedsReply(boolean needsReply) { this.needsReply = needsReply; }

    public Instant getDeadline() { return deadline; }
    public void setDeadline(Instant deadline) { this.deadline = deadline; }

    public String getEvidence() { return evidence; }
    public void setEvidence(String evidence) { this.evidence = evidence; }

    public double getConfidence() { return confidence; }
    public void setConfidence(double confidence) { this.confidence = confidence; }

    public String getModelUsed() { return modelUsed; }
    public void setModelUsed(String modelUsed) { this.modelUsed = modelUsed; }

    public boolean isFeedbackReported() { return feedbackReported; }
    public void setFeedbackReported(boolean feedbackReported) { this.feedbackReported = feedbackReported; }

    public String getFeedbackNotes() { return feedbackNotes; }
    public void setFeedbackNotes(String feedbackNotes) { this.feedbackNotes = feedbackNotes; }

    public Instant getCreatedAt() { return createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }

    /**
     * Resolves the effective category considering user override.
     */
    public String getEffectiveCategory() {
        if (userCategoryOverride != null && !userCategoryOverride.isBlank()) {
            return userCategoryOverride;
        }
        return category;
    }
}

