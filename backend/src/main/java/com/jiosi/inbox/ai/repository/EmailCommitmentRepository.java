package com.jiosi.inbox.ai.repository;

import com.jiosi.inbox.ai.entity.EmailCommitment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface EmailCommitmentRepository extends JpaRepository<EmailCommitment, UUID> {

    List<EmailCommitment> findByThreadId(UUID threadId);

    List<EmailCommitment> findByWorkspaceId(UUID workspaceId);

    List<EmailCommitment> findByWorkspaceIdAndStatus(UUID workspaceId, String status);

    Optional<EmailCommitment> findByWorkspaceIdAndFingerprint(UUID workspaceId, String fingerprint);

    @Query("SELECT c FROM EmailCommitment c WHERE c.workspace.id = :workspaceId AND c.status IN :statuses ORDER BY c.dueDate ASC NULLS LAST, c.createdAt DESC")
    List<EmailCommitment> findActiveCommitments(
            @Param("workspaceId") UUID workspaceId,
            @Param("statuses") List<String> statuses
    );

    @Query("SELECT c FROM EmailCommitment c WHERE c.workspace.id = :workspaceId AND c.actor = :actor AND c.status IN :statuses ORDER BY c.dueDate ASC NULLS LAST")
    List<EmailCommitment> findByWorkspaceIdAndActorAndStatuses(
            @Param("workspaceId") UUID workspaceId,
            @Param("actor") String actor,
            @Param("statuses") List<String> statuses
    );
}
