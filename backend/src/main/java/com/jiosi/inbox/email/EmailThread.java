package com.jiosi.inbox.email;

import com.jiosi.inbox.connectedaccount.ConnectedAccount;
import com.jiosi.inbox.workspace.Workspace;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;

@Entity
@Table(
    name = "email_threads",
    indexes = {
        @Index(name = "idx_threads_workspace_inbox", columnList = "workspace_id, is_archived, is_snoozed, is_sent, is_draft, last_message_at"),
        @Index(name = "idx_threads_workspace_needs_reply", columnList = "workspace_id, is_needs_reply, is_archived, is_sent, is_draft, last_message_at"),
        @Index(name = "idx_threads_workspace_starred", columnList = "workspace_id, is_starred, is_archived, last_message_at"),
        @Index(name = "idx_threads_workspace_snoozed", columnList = "workspace_id, is_snoozed, snoozed_until"),
        @Index(name = "idx_threads_workspace_folder", columnList = "workspace_id, is_archived, is_sent, is_draft, last_message_at"),
        @Index(name = "idx_threads_account_external", columnList = "account_id, external_thread_id")
    }
)
public class EmailThread {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "workspace_id", nullable = false)
    private Workspace workspace;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "account_id")
    private ConnectedAccount account;

    @Column(name = "external_thread_id")
    private String externalThreadId;

    @NotBlank
    @Column(nullable = false, length = 500)
    private String subject;

    @Column(nullable = false, length = 1000)
    private String snippet = "";

    @NotBlank
    @Column(name = "sender_name", nullable = false, length = 150)
    private String senderName;

    @NotBlank
    @Column(name = "sender_email", nullable = false)
    private String senderEmail;

    @Column(name = "sender_avatar", length = 512)
    private String senderAvatar;

    @Column(name = "sender_role", length = 100)
    private String senderRole;

    @Column(name = "recipient_name", length = 150)
    private String recipientName;

    @NotBlank
    @Column(name = "recipient_email", nullable = false)
    private String recipientEmail;

    @Column(name = "is_unread", nullable = false)
    private boolean unread = true;

    @Column(name = "is_starred", nullable = false)
    private boolean starred = false;

    @Column(name = "is_needs_reply", nullable = false)
    private boolean needsReply = false;

    @Column(name = "is_snoozed", nullable = false)
    private boolean snoozed = false;

    @Column(name = "snoozed_until")
    private Instant snoozedUntil;

    @Column(name = "is_archived", nullable = false)
    private boolean archived = false;

    @Column(name = "is_sent", nullable = false)
    private boolean sent = false;

    @Column(name = "is_draft", nullable = false)
    private boolean draft = false;

    @Column(name = "last_message_at", nullable = false)
    private Instant lastMessageAt = Instant.now();

    @Column(name = "message_count", nullable = false)
    private int messageCount = 1;

    @Column(name = "ai_summary", columnDefinition = "TEXT")
    private String aiSummary;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "thread_tags", joinColumns = @JoinColumn(name = "thread_id"))
    @Column(name = "tag", nullable = false, length = 64)
    private Set<String> tags = new HashSet<>();

    @OneToMany(mappedBy = "thread", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @OrderBy("position ASC")
    private List<ThreadActionItem> actionItems = new ArrayList<>();

    @OneToMany(mappedBy = "thread", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @OrderBy("sentAt ASC")
    private List<Email> messages = new ArrayList<>();

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    public EmailThread() {}

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public Workspace getWorkspace() { return workspace; }
    public void setWorkspace(Workspace workspace) { this.workspace = workspace; }

    public ConnectedAccount getAccount() { return account; }
    public void setAccount(ConnectedAccount account) { this.account = account; }

    public String getExternalThreadId() { return externalThreadId; }
    public void setExternalThreadId(String externalThreadId) { this.externalThreadId = externalThreadId; }

    public String getSubject() { return subject; }
    public void setSubject(String subject) { this.subject = subject; }

    public String getSnippet() { return snippet; }
    public void setSnippet(String snippet) { this.snippet = snippet; }

    public String getSenderName() { return senderName; }
    public void setSenderName(String senderName) { this.senderName = senderName; }

    public String getSenderEmail() { return senderEmail; }
    public void setSenderEmail(String senderEmail) { this.senderEmail = senderEmail; }

    public String getSenderAvatar() { return senderAvatar; }
    public void setSenderAvatar(String senderAvatar) { this.senderAvatar = senderAvatar; }

    public String getSenderRole() { return senderRole; }
    public void setSenderRole(String senderRole) { this.senderRole = senderRole; }

    public String getRecipientName() { return recipientName; }
    public void setRecipientName(String recipientName) { this.recipientName = recipientName; }

    public String getRecipientEmail() { return recipientEmail; }
    public void setRecipientEmail(String recipientEmail) { this.recipientEmail = recipientEmail; }

    public boolean isUnread() { return unread; }
    public void setUnread(boolean unread) { this.unread = unread; }

    public boolean isStarred() { return starred; }
    public void setStarred(boolean starred) { this.starred = starred; }

    public boolean isNeedsReply() { return needsReply; }
    public void setNeedsReply(boolean needsReply) { this.needsReply = needsReply; }

    public boolean isSnoozed() { return snoozed; }
    public void setSnoozed(boolean snoozed) { this.snoozed = snoozed; }

    public Instant getSnoozedUntil() { return snoozedUntil; }
    public void setSnoozedUntil(Instant snoozedUntil) { this.snoozedUntil = snoozedUntil; }

    public boolean isArchived() { return archived; }
    public void setArchived(boolean archived) { this.archived = archived; }

    public boolean isSent() { return sent; }
    public void setSent(boolean sent) { this.sent = sent; }

    public boolean isDraft() { return draft; }
    public void setDraft(boolean draft) { this.draft = draft; }

    public Instant getLastMessageAt() { return lastMessageAt; }
    public void setLastMessageAt(Instant lastMessageAt) { this.lastMessageAt = lastMessageAt; }

    public int getMessageCount() { return messageCount; }
    public void setMessageCount(int messageCount) { this.messageCount = messageCount; }

    public String getAiSummary() { return aiSummary; }
    public void setAiSummary(String aiSummary) { this.aiSummary = aiSummary; }

    public Set<String> getTags() { return tags; }
    public void setTags(Set<String> tags) {
        this.tags = (tags != null) ? new HashSet<>(tags) : new HashSet<>();
    }

    public List<ThreadActionItem> getActionItems() { return actionItems; }
    public void setActionItems(List<ThreadActionItem> actionItems) { this.actionItems = actionItems; }

    public List<Email> getMessages() { return messages; }
    public void setMessages(List<Email> messages) { this.messages = messages; }

    public Instant getCreatedAt() { return createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
}
