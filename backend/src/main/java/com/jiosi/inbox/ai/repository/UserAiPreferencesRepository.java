package com.jiosi.inbox.ai.repository;

import com.jiosi.inbox.ai.entity.UserAiPreferences;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserAiPreferencesRepository extends JpaRepository<UserAiPreferences, UUID> {

    Optional<UserAiPreferences> findByUserId(UUID userId);
}
