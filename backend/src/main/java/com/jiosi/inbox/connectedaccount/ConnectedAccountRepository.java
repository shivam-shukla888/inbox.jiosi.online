package com.jiosi.inbox.connectedaccount;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ConnectedAccountRepository extends JpaRepository<ConnectedAccount, UUID> {
    List<ConnectedAccount> findByUserId(UUID userId);
    List<ConnectedAccount> findByUserIdAndProvider(UUID userId, String provider);
    Optional<ConnectedAccount> findFirstByUserIdAndProvider(UUID userId, String provider);
    Optional<ConnectedAccount> findFirstByUserIdAndWorkspaceIdAndProvider(UUID userId, UUID workspaceId, String provider);
    List<ConnectedAccount> findByWorkspaceIdAndProvider(UUID workspaceId, String provider);
    Optional<ConnectedAccount> findByUserIdAndProviderAndEmailAddress(UUID userId, String provider, String emailAddress);
}
