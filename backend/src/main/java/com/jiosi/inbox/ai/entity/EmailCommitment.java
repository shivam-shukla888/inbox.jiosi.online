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
    name = "email_commitments",
    indexes = {
        @Index(name = "idx_email_commitments_ws_status", columnList = "workspace_id, status"),
        @Index(name = "idx_email_commitments_thread", columnList = "thread_id"),
        @Index(name = "idx_email_commitments_fingerprint", columnList = "workspace_id, fingerprint")
    }
)
public class EmailCommitment {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "thread_id", nullable = false)
    private EmailThread thread;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "workspace_id", nullable = false)
    private Workspace workspace;

    @Column(name = "source_message_id", length = 255)
    private String sourceMessageId;

    @Column(name = "actor", nullable = false, length = 32)
    private String actor = "unknown"; // "user", "other", "unknown"

    @Column(name = "action", nullable = false, length = 500)
    private String action;

    @Column(name = "target", length = 255)
    private String target;

    @Column(name = "due_date")
    private Instant dueDate;

    @Column(name = "evidence_quote", columnDefinition = "TEXT")
    private String evidenceQuote;

    @Column(name = "status", nullable = false, length = 32)
    private String status = "open"; // proposed, confirmed, open, done, cancelled, superseded, needs_review

    @Column(name = "user_status_override", length = 32)
    private String userStatusOverride;

    @Column(name = "audit_note", length = 500)
    private String auditNote;

    @Column(name = "fingerprint", nullable = false, length = 255)
    private String fingerprint;

    @Column(name = "confidence", nullable = false)
    private double confidence = 0.8;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    public EmailCommitment() {}

    public EmailCommitment(EmailThread thread, Workspace workspace, String actor, String action, String fingerprint) {
        this.thread = thread;
        this.workspace = workspace;
        this.actor = actor != null ? actor : "unknown";
        this.action = action;
        this.fingerprint = fingerprint;
    }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public EmailThread getThread() { return thread; }
    public void setThread(EmailThread thread) { this.thread = thread; }

    public Workspace getWorkspace() { return workspace; }
    public void setWorkspace(Workspace workspace) { this.workspace = workspace; }

    public String getSourceMessageId() { return sourceMessageId; }
    public void setSourceMessageId(String sourceMessageId) { this.sourceMessageId = sourceMessageId; }

    public String getActor() { return actor; }
    public void setActor(String actor) { this.actor = actor; }

    public String getAction() { return action; }
    public void setAction(String action) { this.action = action; }

    public String getTarget() { return target; }
    public void setTarget(String target) { this.target = target; }

    public Instant getDueDate() { return dueDate; }
    public void setDueDate(Instant dueDate) { this.dueDate = dueDate; }

    public String getEvidenceQuote() { return evidenceQuote; }
    public void setEvidenceQuote(String evidenceQuote) { this.evidenceQuote = evidenceQuote; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getUserStatusOverride() { return userStatusOverride; }
    public void setUserStatusOverride(String userStatusOverride) { this.userStatusOverride = userStatusOverride; }

    public String getEffectiveStatus() {
        return userStatusOverride != null && !userStatusOverride.isBlank() ? userStatusOverride : status;
    }

    public String getAuditNote() { return auditNote; }
    public void setAuditNote(String auditNote) { this.auditNote = auditNote; }

    public String getFingerprint() { return fingerprint; }
    public void setFingerprint(String fingerprint) { this.fingerprint = fingerprint; }

    public double getConfidence() { return confidence; }
    public void setConfidence(double confidence) { this.confidence = confidence; }

    public Instant getCreatedAt() { return createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
}

