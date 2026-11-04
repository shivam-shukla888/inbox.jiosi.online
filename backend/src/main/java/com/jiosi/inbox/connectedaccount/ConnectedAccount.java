package com.jiosi.inbox.connectedaccount;

import com.jiosi.inbox.user.User;
import jakarta.persistence.*;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(
    name = "connected_accounts",
    uniqueConstraints = @UniqueConstraint(columnNames = {"user_id", "provider", "email_address"})
)
public class ConnectedAccount {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "workspace_id")
    private com.jiosi.inbox.workspace.Workspace workspace;

    @NotBlank
    @Column(nullable = false, length = 50)
    private String provider;

    @NotBlank
    @Email
    @Column(name = "email_address", nullable = false)
    private String emailAddress;

    @NotBlank
    @Column(nullable = false, length = 32)
    private String status;

    @Column(name = "last_sync_at")
    private Instant lastSyncAt;

    @Column(name = "access_token_encrypted", columnDefinition = "TEXT")
    private String accessTokenEncrypted;

    @Column(name = "refresh_token_encrypted", columnDefinition = "TEXT")
    private String refreshTokenEncrypted;

    @Column(name = "token_expires_at")
    private Instant tokenExpiresAt;

    @Column(name = "scope", length = 512)
    private String scope;

    @Column(name = "history_id", length = 64)
    private String historyId;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    public ConnectedAccount() {}

    public ConnectedAccount(User user, String provider, String emailAddress, String status) {
        this.user = user;
        this.provider = provider;
        this.emailAddress = emailAddress;
        this.status = status;
    }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }

    public com.jiosi.inbox.workspace.Workspace getWorkspace() { return workspace; }
    public void setWorkspace(com.jiosi.inbox.workspace.Workspace workspace) { this.workspace = workspace; }

    public String getProvider() { return provider; }
    public void setProvider(String provider) { this.provider = provider; }

    public String getEmailAddress() { return emailAddress; }
    public void setEmailAddress(String emailAddress) { this.emailAddress = emailAddress; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public Instant getLastSyncAt() { return lastSyncAt; }
    public void setLastSyncAt(Instant lastSyncAt) { this.lastSyncAt = lastSyncAt; }

    public String getAccessTokenEncrypted() { return accessTokenEncrypted; }
    public void setAccessTokenEncrypted(String accessTokenEncrypted) { this.accessTokenEncrypted = accessTokenEncrypted; }

    public String getRefreshTokenEncrypted() { return refreshTokenEncrypted; }
    public void setRefreshTokenEncrypted(String refreshTokenEncrypted) { this.refreshTokenEncrypted = refreshTokenEncrypted; }

    public Instant getTokenExpiresAt() { return tokenExpiresAt; }
    public void setTokenExpiresAt(Instant tokenExpiresAt) { this.tokenExpiresAt = tokenExpiresAt; }

    public String getScope() { return scope; }
    public void setScope(String scope) { this.scope = scope; }

    public String getHistoryId() { return historyId; }
    public void setHistoryId(String historyId) { this.historyId = historyId; }

    public Instant getCreatedAt() { return createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
}
