package com.jiosi.inbox.email;

import com.jiosi.inbox.common.ResourceNotFoundException;
import com.jiosi.inbox.email.dto.*;
import com.jiosi.inbox.workspace.Workspace;
import com.jiosi.inbox.workspace.WorkspaceRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.*;

@Service
public class EmailThreadService {

    private static final Logger log = LoggerFactory.getLogger(EmailThreadService.class);
    private static final DateTimeFormatter TIME_FORMATTER = DateTimeFormatter.ofPattern("hh:mm a").withZone(ZoneId.of("UTC"));
    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("MMM dd").withZone(ZoneId.of("UTC"));

    private final EmailThreadRepository threadRepository;
    private final EmailRepository emailRepository;
    private final WorkspaceRepository workspaceRepository;

    public EmailThreadService(
            EmailThreadRepository threadRepository,
            EmailRepository emailRepository,
            WorkspaceRepository workspaceRepository
    ) {
        this.threadRepository = threadRepository;
        this.emailRepository = emailRepository;
        this.workspaceRepository = workspaceRepository;
    }

    @Transactional(readOnly = true)
    public PagedThreadsResponse getThreads(UUID workspaceId, String folder, String filter, int page, int size) {
        validateWorkspace(workspaceId);
        int boundedSize = Math.clamp(size, 1, 100);
        int boundedPage = Math.max(page, 0);

        Pageable pageable = PageRequest.of(boundedPage, boundedSize, Sort.by(Sort.Direction.DESC, "lastMessageAt"));
        Page<EmailThread> threadPage;

        String safeFolder = (folder != null) ? folder.toLowerCase().trim() : "inbox";
        String safeFilter = (filter != null) ? filter.toLowerCase().trim() : "all";

        switch (safeFolder) {
            case "needs-reply" -> threadPage = threadRepository.findNeedsReplyFolder(workspaceId, pageable);
            case "starred" -> threadPage = threadRepository.findStarredFolder(workspaceId, pageable);
            case "snoozed" -> threadPage = threadRepository.findSnoozedFolder(workspaceId, pageable);
            case "sent" -> threadPage = threadRepository.findSentFolder(workspaceId, pageable);
            case "drafts" -> threadPage = threadRepository.findDraftsFolder(workspaceId, pageable);
            case "inbox" -> {
                threadPage = switch (safeFilter) {
                    case "unread" -> threadRepository.findInboxUnread(workspaceId, pageable);
                    case "needs-reply" -> threadRepository.findInboxNeedsReply(workspaceId, pageable);
                    case "vip" -> threadRepository.findInboxVip(workspaceId, pageable);
                    default -> threadRepository.findInboxAll(workspaceId, pageable);
                };
            }
            default -> threadPage = threadRepository.findInboxAll(workspaceId, pageable);
        }

        List<ThreadSummaryDto> dtoList = threadPage.getContent().stream()
                .map(this::toSummaryDto)
                .toList();

        FolderCountsDto counts = getFolderCounts(workspaceId);

        return new PagedThreadsResponse(
                dtoList,
                threadPage.getNumber(),
                threadPage.getSize(),
                threadPage.getTotalElements(),
                threadPage.getTotalPages(),
                threadPage.isFirst(),
                threadPage.isLast(),
                counts
        );
    }

    @Transactional(readOnly = true)
    public ThreadDetailDto getThreadDetail(UUID workspaceId, UUID threadId) {
        validateWorkspace(workspaceId);
        EmailThread thread = threadRepository.findByWorkspaceIdAndId(workspaceId, threadId)
                .orElseThrow(() -> new ResourceNotFoundException("Thread not found: " + threadId));

        List<Email> messages = emailRepository.findByThreadIdOrderBySentAtAsc(threadId);

        List<EmailMessageDto> messageDtos = messages.stream().map(msg -> {
            List<AttachmentSummaryDto> attDtos = (msg.getAttachments() != null)
                    ? msg.getAttachments().stream().map(a -> new AttachmentSummaryDto(
                            a.getId().toString(),
                            a.getFilename(),
                            formatFileSize(a.getSizeBytes()),
                            a.getContentType()
                    )).toList()
                    : List.of();

            return new EmailMessageDto(
                    msg.getId().toString(),
                    new SenderDto(msg.getSenderName(), msg.getSenderEmail(), msg.getSenderAvatar(), null),
                    new RecipientDto(msg.getRecipientName() != null ? msg.getRecipientName() : msg.getRecipientEmail(), msg.getRecipientEmail()),
                    splitList(msg.getCc()),
                    splitList(msg.getBcc()),
                    msg.getSubject(),
                    msg.getSnippet(),
                    msg.getBodyText(),
                    msg.getBodyHtml(),
                    msg.getSentAt().toString(),
                    attDtos
            );
        }).toList();

        String body = messages.isEmpty() ? thread.getSnippet() : messages.get(messages.size() - 1).getBodyText();
        List<String> cc = messages.isEmpty() ? List.of() : splitList(messages.get(messages.size() - 1).getCc());
        List<String> bcc = messages.isEmpty() ? List.of() : splitList(messages.get(messages.size() - 1).getBcc());

        List<AttachmentSummaryDto> allAttachments = messages.stream()
                .flatMap(m -> (m.getAttachments() != null ? m.getAttachments().stream() : java.util.stream.Stream.empty()))
                .map(a -> new AttachmentSummaryDto(
                        a.getId().toString(),
                        a.getFilename(),
                        formatFileSize(a.getSizeBytes()),
                        a.getContentType()
                )).toList();

        List<String> actionItems = (thread.getActionItems() != null)
                ? thread.getActionItems().stream().map(ThreadActionItem::getItemText).toList()
                : List.of();

        return new ThreadDetailDto(
                thread.getId().toString(),
                new SenderDto(thread.getSenderName(), thread.getSenderEmail(), thread.getSenderAvatar(), thread.getSenderRole()),
                new RecipientDto(thread.getRecipientName() != null ? thread.getRecipientName() : thread.getRecipientEmail(), thread.getRecipientEmail()),
                cc,
                bcc,
                thread.getSubject(),
                thread.getSnippet(),
                body,
                formatTimestamp(thread.getLastMessageAt()),
                formatDate(thread.getLastMessageAt()),
                thread.isUnread(),
                thread.isStarred(),
                thread.isNeedsReply(),
                thread.isSnoozed(),
                thread.getSnoozedUntil() != null ? thread.getSnoozedUntil().toString() : null,
                thread.isArchived(),
                thread.isSent(),
                thread.isDraft(),
                new ArrayList<>(thread.getTags()),
                allAttachments,
                thread.getAiSummary(),
                actionItems,
                messageDtos
        );
    }

    @Transactional(readOnly = true)
    public PagedThreadsResponse searchThreads(UUID workspaceId, String query, int page, int size) {
        validateWorkspace(workspaceId);
        int boundedSize = Math.clamp(size, 1, 100);
        int boundedPage = Math.max(page, 0);

        Pageable pageable = PageRequest.of(boundedPage, boundedSize, Sort.by(Sort.Direction.DESC, "lastMessageAt"));
        Page<EmailThread> threadPage = threadRepository.searchThreads(workspaceId, (query != null ? query.trim() : ""), pageable);

        List<ThreadSummaryDto> dtoList = threadPage.getContent().stream()
                .map(this::toSummaryDto)
                .toList();

        FolderCountsDto counts = getFolderCounts(workspaceId);

        return new PagedThreadsResponse(
                dtoList,
                threadPage.getNumber(),
                threadPage.getSize(),
                threadPage.getTotalElements(),
                threadPage.getTotalPages(),
                threadPage.isFirst(),
                threadPage.isLast(),
                counts
        );
    }

    @Transactional
    public ThreadSummaryDto updateRead(UUID workspaceId, UUID threadId, boolean unread) {
        validateWorkspace(workspaceId);
        EmailThread thread = threadRepository.findByWorkspaceIdAndId(workspaceId, threadId)
                .orElseThrow(() -> new ResourceNotFoundException("Thread not found: " + threadId));

        thread.setUnread(unread);
        threadRepository.save(thread);
        log.info("Workspace {} updated thread {} unread={}", workspaceId, threadId, unread);
        return toSummaryDto(thread);
    }

    @Transactional
    public ThreadSummaryDto updateStar(UUID workspaceId, UUID threadId, boolean starred) {
        validateWorkspace(workspaceId);
        EmailThread thread = threadRepository.findByWorkspaceIdAndId(workspaceId, threadId)
                .orElseThrow(() -> new ResourceNotFoundException("Thread not found: " + threadId));

        thread.setStarred(starred);
        threadRepository.save(thread);
        log.info("Workspace {} updated thread {} starred={}", workspaceId, threadId, starred);
        return toSummaryDto(thread);
    }

    @Transactional
    public ThreadSummaryDto updateArchive(UUID workspaceId, UUID threadId, boolean archived) {
        validateWorkspace(workspaceId);
        EmailThread thread = threadRepository.findByWorkspaceIdAndId(workspaceId, threadId)
                .orElseThrow(() -> new ResourceNotFoundException("Thread not found: " + threadId));

        thread.setArchived(archived);
        threadRepository.save(thread);
        log.info("Workspace {} updated thread {} archived={}", workspaceId, threadId, archived);
        return toSummaryDto(thread);
    }

    @Transactional
    public ThreadSummaryDto updateSnooze(UUID workspaceId, UUID threadId, boolean snoozed, String snoozedUntil) {
        validateWorkspace(workspaceId);
        EmailThread thread = threadRepository.findByWorkspaceIdAndId(workspaceId, threadId)
                .orElseThrow(() -> new ResourceNotFoundException("Thread not found: " + threadId));

        thread.setSnoozed(snoozed);
        if (snoozed && snoozedUntil != null && !snoozedUntil.isBlank()) {
            try {
                thread.setSnoozedUntil(Instant.parse(snoozedUntil));
            } catch (Exception e) {
                // If relative date or parse fails, default to 24h from now
                thread.setSnoozedUntil(Instant.now().plusSeconds(86400));
            }
        } else {
            thread.setSnoozedUntil(null);
        }
        threadRepository.save(thread);
        log.info("Workspace {} updated thread {} snoozed={}", workspaceId, threadId, snoozed);
        return toSummaryDto(thread);
    }

    @Transactional
    public void batchUpdateRead(UUID workspaceId, List<UUID> threadIds, boolean unread) {
        validateWorkspace(workspaceId);
        if (threadIds == null || threadIds.isEmpty()) return;

        for (UUID id : threadIds) {
            threadRepository.findByWorkspaceIdAndId(workspaceId, id).ifPresent(t -> {
                t.setUnread(unread);
                threadRepository.save(t);
            });
        }
        log.info("Workspace {} batch updated {} threads unread={}", workspaceId, threadIds.size(), unread);
    }

    @Transactional
    public void batchUpdateArchive(UUID workspaceId, List<UUID> threadIds, boolean archived) {
        validateWorkspace(workspaceId);
        if (threadIds == null || threadIds.isEmpty()) return;

        for (UUID id : threadIds) {
            threadRepository.findByWorkspaceIdAndId(workspaceId, id).ifPresent(t -> {
                t.setArchived(archived);
                threadRepository.save(t);
            });
        }
        log.info("Workspace {} batch updated {} threads archived={}", workspaceId, threadIds.size(), archived);
    }

    @Transactional
    public ThreadDetailDto sendReply(UUID workspaceId, UUID threadId, SendReplyRequest request) {
        validateWorkspace(workspaceId);
        EmailThread thread = threadRepository.findByWorkspaceIdAndId(workspaceId, threadId)
                .orElseThrow(() -> new ResourceNotFoundException("Thread not found: " + threadId));

        Email reply = new Email();
        reply.setWorkspace(thread.getWorkspace());
        reply.setThread(thread);
        reply.setAccount(thread.getAccount());
        reply.setSenderName("Alex Rivera");
        reply.setSenderEmail("alex@jiosi.online");
        reply.setSenderAvatar("AR");
        reply.setRecipientName(thread.getSenderName());
        reply.setRecipientEmail(request.toEmail() != null && !request.toEmail().isBlank() ? request.toEmail() : thread.getSenderEmail());
        reply.setSubject("Re: " + thread.getSubject());
        reply.setBodyText(request.body());
        reply.setSnippet(truncate(request.body(), 90));
        reply.setSentAt(Instant.now());
        emailRepository.save(reply);

        thread.setMessageCount(thread.getMessageCount() + 1);
        thread.setLastMessageAt(Instant.now());
        thread.setSnippet(reply.getSnippet());
        thread.setNeedsReply(false);
        thread.setSent(true);
        threadRepository.save(thread);

        log.info("Workspace {} saved synthetic reply to thread {}", workspaceId, threadId);
        return getThreadDetail(workspaceId, threadId);
    }

    @Transactional
    public ThreadSummaryDto createNewThread(UUID workspaceId, SendEmailRequest request) {
        Workspace ws = validateWorkspace(workspaceId);

        EmailThread thread = new EmailThread();
        thread.setWorkspace(ws);
        thread.setSenderName("Alex Rivera");
        thread.setSenderEmail("alex@jiosi.online");
        thread.setSenderAvatar("AR");
        thread.setSenderRole("Founder");
        thread.setRecipientEmail(request.toEmail());
        thread.setRecipientName(request.toEmail().split("@")[0]);
        thread.setSubject(request.subject());
        thread.setSnippet(truncate(request.body(), 90));
        thread.setUnread(false);
        thread.setStarred(false);
        thread.setNeedsReply(false);
        thread.setSnoozed(false);
        thread.setSent(true);
        thread.setDraft(false);
        thread.setLastMessageAt(Instant.now());
        thread.setMessageCount(1);
        thread.getTags().add("Outgoing");
        thread = threadRepository.save(thread);

        Email email = new Email();
        email.setWorkspace(ws);
        email.setThread(thread);
        email.setSenderName("Alex Rivera");
        email.setSenderEmail("alex@jiosi.online");
        email.setSenderAvatar("AR");
        email.setRecipientName(thread.getRecipientName());
        email.setRecipientEmail(request.toEmail());
        email.setSubject(request.subject());
        email.setBodyText(request.body());
        email.setSnippet(thread.getSnippet());
        email.setSentAt(Instant.now());
        emailRepository.save(email);

        log.info("Workspace {} created sent thread {}", workspaceId, thread.getId());
        return toSummaryDto(thread);
    }

    @Transactional(readOnly = true)
    public FolderCountsDto getFolderCounts(UUID workspaceId) {
        validateWorkspace(workspaceId);

        List<Object[]> rows = threadRepository.getAggregatedFolderCounts(workspaceId);
        long inboxTotal = 0;
        long inboxUnread = 0;
        long needsReplyTotal = 0;
        long needsReplyUnread = 0;
        long starredTotal = 0;
        long snoozedTotal = 0;
        long sentTotal = 0;
        long draftsTotal = 0;

        if (rows != null && !rows.isEmpty() && rows.get(0) != null) {
            Object[] r = rows.get(0);
            inboxTotal = r[0] != null ? ((Number) r[0]).longValue() : 0L;
            inboxUnread = r[1] != null ? ((Number) r[1]).longValue() : 0L;
            needsReplyTotal = r[2] != null ? ((Number) r[2]).longValue() : 0L;
            needsReplyUnread = r[3] != null ? ((Number) r[3]).longValue() : 0L;
            starredTotal = r[4] != null ? ((Number) r[4]).longValue() : 0L;
            snoozedTotal = r[5] != null ? ((Number) r[5]).longValue() : 0L;
            sentTotal = r[6] != null ? ((Number) r[6]).longValue() : 0L;
            draftsTotal = r[7] != null ? ((Number) r[7]).longValue() : 0L;
        }

        return new FolderCountsDto(
                new FolderCountsDto.FolderCountItem(inboxTotal, inboxUnread),
                new FolderCountsDto.FolderCountItem(needsReplyTotal, needsReplyUnread),
                starredTotal,
                snoozedTotal,
                sentTotal,
                draftsTotal,
                inboxTotal,
                inboxUnread,
                needsReplyTotal,
                0L
        );
    }

    private Workspace validateWorkspace(UUID workspaceId) {
        if (workspaceId == null) {
            throw new IllegalArgumentException("Workspace ID must not be null");
        }
        return workspaceRepository.findById(workspaceId)
                .orElseThrow(() -> new ResourceNotFoundException("Workspace not found: " + workspaceId));
    }

    private ThreadSummaryDto toSummaryDto(EmailThread t) {
        List<String> actionItemStrings = (t.getActionItems() != null)
                ? t.getActionItems().stream().map(ThreadActionItem::getItemText).toList()
                : List.of();

        return new ThreadSummaryDto(
                t.getId().toString(),
                new SenderDto(t.getSenderName(), t.getSenderEmail(), t.getSenderAvatar(), t.getSenderRole()),
                new RecipientDto(t.getRecipientName() != null ? t.getRecipientName() : t.getRecipientEmail(), t.getRecipientEmail()),
                List.of(),
                List.of(),
                t.getSubject(),
                t.getSnippet(),
                t.getSnippet(),
                formatTimestamp(t.getLastMessageAt()),
                formatDate(t.getLastMessageAt()),
                t.isUnread(),
                t.isStarred(),
                t.isNeedsReply(),
                t.isSnoozed(),
                t.getSnoozedUntil() != null ? t.getSnoozedUntil().toString() : null,
                t.isArchived(),
                t.isSent(),
                t.isDraft(),
                formatTimestamp(t.getUpdatedAt()),
                new ArrayList<>(t.getTags()),
                List.of(),
                t.getAiSummary(),
                actionItemStrings,
                t.getMessageCount()
        );
    }

    private String formatTimestamp(Instant instant) {
        if (instant == null) return "Just now";
        return TIME_FORMATTER.format(instant);
    }

    private String formatDate(Instant instant) {
        if (instant == null) return "Today";
        return DATE_FORMATTER.format(instant);
    }

    private String truncate(String text, int maxLength) {
        if (text == null) return "";
        return text.length() <= maxLength ? text : text.substring(0, maxLength) + "...";
    }

    private String formatFileSize(long bytes) {
        if (bytes < 1024) return bytes + " B";
        if (bytes < 1024 * 1024) return (bytes / 1024) + " KB";
        return String.format("%.1f MB", bytes / (1024.0 * 1024.0));
    }

    private List<String> splitList(String text) {
        if (text == null || text.isBlank()) return List.of();
        return Arrays.stream(text.split(","))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .toList();
    }
}
