package com.jiosi.inbox.ai.repository;

import com.jiosi.inbox.ai.entity.ThreadAiTriage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface ThreadAiTriageRepository extends JpaRepository<ThreadAiTriage, UUID> {

    Optional<ThreadAiTriage> findByThreadIdAndWorkspaceId(UUID threadId, UUID workspaceId);

    Optional<ThreadAiTriage> findByThreadId(UUID threadId);
}

