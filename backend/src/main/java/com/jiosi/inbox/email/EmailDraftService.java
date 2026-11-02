package com.jiosi.inbox.email;

import com.jiosi.inbox.common.ResourceNotFoundException;
import com.jiosi.inbox.email.dto.DraftDto;
import com.jiosi.inbox.email.dto.SaveDraftRequest;
import com.jiosi.inbox.workspace.Workspace;
import com.jiosi.inbox.workspace.WorkspaceRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.UUID;

@Service
public class EmailDraftService {

    private static final Logger log = LoggerFactory.getLogger(EmailDraftService.class);

    private final EmailDraftRepository draftRepository;
    private final EmailThreadRepository threadRepository;
    private final WorkspaceRepository workspaceRepository;

    public EmailDraftService(
            EmailDraftRepository draftRepository,
            EmailThreadRepository threadRepository,
            WorkspaceRepository workspaceRepository
    ) {
        this.draftRepository = draftRepository;
        this.threadRepository = threadRepository;
        this.workspaceRepository = workspaceRepository;
    }

    @Transactional(readOnly = true)
    public Page<DraftDto> getDrafts(UUID workspaceId, int page, int size) {
        validateWorkspace(workspaceId);
        int boundedSize = Math.clamp(size, 1, 100);
        int boundedPage = Math.max(page, 0);

        Pageable pageable = PageRequest.of(boundedPage, boundedSize);
        return draftRepository.findByWorkspaceIdOrderByUpdatedAtDesc(workspaceId, pageable)
                .map(this::toDto);
    }

    @Transactional(readOnly = true)
    public DraftDto getDraft(UUID workspaceId, UUID draftId) {
        validateWorkspace(workspaceId);
        EmailDraft draft = draftRepository.findByWorkspaceIdAndId(workspaceId, draftId)
                .orElseThrow(() -> new ResourceNotFoundException("Draft not found: " + draftId));
        return toDto(draft);
    }

    @Transactional
    public DraftDto saveDraft(UUID workspaceId, SaveDraftRequest request) {
        Workspace ws = validateWorkspace(workspaceId);

        EmailDraft draft;
        if (request.draftId() != null) {
            draft = draftRepository.findByWorkspaceIdAndId(workspaceId, request.draftId())
                    .orElseGet(() -> {
                        EmailDraft newD = new EmailDraft();
                        newD.setWorkspace(ws);
                        return newD;
                    });
        } else {
            draft = new EmailDraft();
            draft.setWorkspace(ws);
        }

        if (request.threadId() != null) {
            threadRepository.findByWorkspaceIdAndId(workspaceId, request.threadId())
                    .ifPresent(draft::setThread);
        }

        draft.setToEmail(request.toEmail());
        draft.setRecipientName(request.recipientName());
        draft.setSubject(request.subject() != null ? request.subject() : "(No subject)");
        draft.setBody(request.body() != null ? request.body() : "");

        EmailDraft saved = draftRepository.save(draft);
        log.info("Workspace {} saved draft {}", workspaceId, saved.getId());
        return toDto(saved);
    }

    @Transactional
    public void deleteDraft(UUID workspaceId, UUID draftId) {
        validateWorkspace(workspaceId);
        EmailDraft draft = draftRepository.findByWorkspaceIdAndId(workspaceId, draftId)
                .orElseThrow(() -> new ResourceNotFoundException("Draft not found: " + draftId));

        draftRepository.delete(draft);
        log.info("Workspace {} deleted draft {}", workspaceId, draftId);
    }

    private Workspace validateWorkspace(UUID workspaceId) {
        if (workspaceId == null) {
            throw new IllegalArgumentException("Workspace ID must not be null");
        }
        return workspaceRepository.findById(workspaceId)
                .orElseThrow(() -> new ResourceNotFoundException("Workspace not found: " + workspaceId));
    }

    private DraftDto toDto(EmailDraft d) {
        return new DraftDto(
                d.getId().toString(),
                d.getThread() != null ? d.getThread().getId().toString() : null,
                d.getToEmail(),
                d.getRecipientName(),
                d.getSubject(),
                d.getBody(),
                d.getUpdatedAt() != null ? d.getUpdatedAt().toString() : Instant.now().toString()
        );
    }
}
