package com.jiosi.inbox.email;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface EmailDraftRepository extends JpaRepository<EmailDraft, UUID> {

    Page<EmailDraft> findByWorkspaceIdOrderByUpdatedAtDesc(UUID workspaceId, Pageable pageable);

    Optional<EmailDraft> findByWorkspaceIdAndId(UUID workspaceId, UUID id);

    long countByWorkspaceId(UUID workspaceId);
}
