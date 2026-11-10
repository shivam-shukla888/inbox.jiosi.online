package com.jiosi.inbox.ai.repository;

import com.jiosi.inbox.ai.entity.UserBusinessProfile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserBusinessProfileRepository extends JpaRepository<UserBusinessProfile, UUID> {

    Optional<UserBusinessProfile> findByUserIdAndWorkspaceId(UUID userId, UUID workspaceId);
}

