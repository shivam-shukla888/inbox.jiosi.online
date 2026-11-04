package com.jiosi.inbox.email;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface EmailRepository extends JpaRepository<Email, UUID> {

    List<Email> findByThreadIdOrderBySentAtAsc(UUID threadId);

    Optional<Email> findByWorkspaceIdAndId(UUID workspaceId, UUID id);

    boolean existsByAccountIdAndExternalMessageId(UUID accountId, String externalMessageId);

    Optional<Email> findByAccountIdAndExternalMessageId(UUID accountId, String externalMessageId);
}
