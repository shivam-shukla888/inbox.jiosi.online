package com.jiosi.inbox.email;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface EmailThreadRepository extends JpaRepository<EmailThread, UUID> {

    Optional<EmailThread> findByWorkspaceIdAndId(UUID workspaceId, UUID id);

    default Optional<EmailThread> findByIdAndWorkspaceId(UUID id, UUID workspaceId) {
        return findByWorkspaceIdAndId(workspaceId, id);
    }

    Optional<EmailThread> findByAccountIdAndExternalThreadId(UUID accountId, String externalThreadId);

    Optional<EmailThread> findByWorkspaceIdAndExternalThreadId(UUID workspaceId, String externalThreadId);

    // 1. Inbox Folder Queries
    @Query("SELECT t FROM EmailThread t WHERE t.workspace.id = :workspaceId AND t.archived = false AND t.snoozed = false AND t.sent = false AND t.draft = false")
    Page<EmailThread> findInboxAll(@Param("workspaceId") UUID workspaceId, Pageable pageable);

    @Query("SELECT t FROM EmailThread t WHERE t.workspace.id = :workspaceId AND t.archived = false AND t.snoozed = false AND t.sent = false AND t.draft = false AND t.unread = true")
    Page<EmailThread> findInboxUnread(@Param("workspaceId") UUID workspaceId, Pageable pageable);

    @Query("SELECT t FROM EmailThread t WHERE t.workspace.id = :workspaceId AND t.archived = false AND t.snoozed = false AND t.sent = false AND t.draft = false AND t.needsReply = true")
    Page<EmailThread> findInboxNeedsReply(@Param("workspaceId") UUID workspaceId, Pageable pageable);

    @Query("SELECT DISTINCT t FROM EmailThread t JOIN t.tags tag WHERE t.workspace.id = :workspaceId AND t.archived = false AND t.snoozed = false AND t.sent = false AND t.draft = false AND tag IN ('VIP', 'Fundraising')")
    Page<EmailThread> findInboxVip(@Param("workspaceId") UUID workspaceId, Pageable pageable);

    // 2. Dedicated Folder Queries
    @Query("SELECT t FROM EmailThread t WHERE t.workspace.id = :workspaceId AND t.needsReply = true AND t.archived = false AND t.sent = false AND t.draft = false")
    Page<EmailThread> findNeedsReplyFolder(@Param("workspaceId") UUID workspaceId, Pageable pageable);

    @Query("SELECT t FROM EmailThread t WHERE t.workspace.id = :workspaceId AND t.starred = true AND t.archived = false")
    Page<EmailThread> findStarredFolder(@Param("workspaceId") UUID workspaceId, Pageable pageable);

    @Query("SELECT t FROM EmailThread t WHERE t.workspace.id = :workspaceId AND t.snoozed = true")
    Page<EmailThread> findSnoozedFolder(@Param("workspaceId") UUID workspaceId, Pageable pageable);

    @Query("SELECT t FROM EmailThread t WHERE t.workspace.id = :workspaceId AND t.sent = true")
    Page<EmailThread> findSentFolder(@Param("workspaceId") UUID workspaceId, Pageable pageable);

    @Query("SELECT t FROM EmailThread t WHERE t.workspace.id = :workspaceId AND t.draft = true")
    Page<EmailThread> findDraftsFolder(@Param("workspaceId") UUID workspaceId, Pageable pageable);

    // 3. Search Query
    @Query("SELECT t FROM EmailThread t WHERE t.workspace.id = :workspaceId AND (" +
            "LOWER(t.subject) LIKE LOWER(CONCAT('%', :q, '%')) OR " +
            "LOWER(t.snippet) LIKE LOWER(CONCAT('%', :q, '%')) OR " +
            "LOWER(t.senderName) LIKE LOWER(CONCAT('%', :q, '%')) OR " +
            "LOWER(t.senderEmail) LIKE LOWER(CONCAT('%', :q, '%')) OR " +
            "LOWER(t.recipientName) LIKE LOWER(CONCAT('%', :q, '%')) OR " +
            "LOWER(t.recipientEmail) LIKE LOWER(CONCAT('%', :q, '%')))")
    Page<EmailThread> searchThreads(@Param("workspaceId") UUID workspaceId, @Param("q") String query, Pageable pageable);

    // 4. Folder Counts for Badges & UI Filters (Single Aggregated Query for High Concurrency)
    @Query("""
        SELECT 
            COALESCE(SUM(CASE WHEN t.archived = false AND t.snoozed = false AND t.sent = false AND t.draft = false THEN 1L ELSE 0L END), 0L),
            COALESCE(SUM(CASE WHEN t.archived = false AND t.snoozed = false AND t.sent = false AND t.draft = false AND t.unread = true THEN 1L ELSE 0L END), 0L),
            COALESCE(SUM(CASE WHEN t.needsReply = true AND t.archived = false AND t.sent = false AND t.draft = false THEN 1L ELSE 0L END), 0L),
            COALESCE(SUM(CASE WHEN t.needsReply = true AND t.archived = false AND t.sent = false AND t.draft = false AND t.unread = true THEN 1L ELSE 0L END), 0L),
            COALESCE(SUM(CASE WHEN t.starred = true AND t.archived = false THEN 1L ELSE 0L END), 0L),
            COALESCE(SUM(CASE WHEN t.snoozed = true THEN 1L ELSE 0L END), 0L),
            COALESCE(SUM(CASE WHEN t.sent = true THEN 1L ELSE 0L END), 0L),
            COALESCE(SUM(CASE WHEN t.draft = true THEN 1L ELSE 0L END), 0L)
        FROM EmailThread t
        WHERE t.workspace.id = :workspaceId
    """)
    List<Object[]> getAggregatedFolderCounts(@Param("workspaceId") UUID workspaceId);

    long countByWorkspaceIdAndArchivedFalseAndSnoozedFalseAndSentFalseAndDraftFalse(UUID workspaceId);

    long countByWorkspaceIdAndArchivedFalseAndSnoozedFalseAndSentFalseAndDraftFalseAndUnreadTrue(UUID workspaceId);

    long countByWorkspaceIdAndNeedsReplyTrueAndArchivedFalseAndSentFalseAndDraftFalse(UUID workspaceId);

    long countByWorkspaceIdAndNeedsReplyTrueAndArchivedFalseAndSentFalseAndDraftFalseAndUnreadTrue(UUID workspaceId);

    long countByWorkspaceIdAndStarredTrueAndArchivedFalse(UUID workspaceId);

    long countByWorkspaceIdAndSnoozedTrue(UUID workspaceId);

    long countByWorkspaceIdAndSentTrue(UUID workspaceId);

    long countByWorkspaceIdAndDraftTrue(UUID workspaceId);

    @Query("SELECT COUNT(DISTINCT t) FROM EmailThread t JOIN t.tags tag WHERE t.workspace.id = :workspaceId AND t.archived = false AND t.snoozed = false AND t.sent = false AND t.draft = false AND tag IN ('VIP', 'Fundraising')")
    long countInboxVip(@Param("workspaceId") UUID workspaceId);
}
