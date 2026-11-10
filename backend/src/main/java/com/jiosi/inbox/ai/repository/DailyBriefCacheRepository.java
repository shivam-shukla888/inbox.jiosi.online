package com.jiosi.inbox.ai.repository;

import com.jiosi.inbox.ai.entity.DailyBriefCache;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface DailyBriefCacheRepository extends JpaRepository<DailyBriefCache, UUID> {

    Optional<DailyBriefCache> findByUserIdAndWorkspaceIdAndBriefDate(UUID userId, UUID workspaceId, String briefDate);

    void deleteByWorkspaceIdAndBriefDate(UUID workspaceId, String briefDate);
}
