package com.jiosi.inbox.email.dto;

import java.util.List;

public record EmailMessageDto(
    String id,
    SenderDto sender,
    RecipientDto recipient,
    List<String> cc,
    List<String> bcc,
    String subject,
    String snippet,
    String bodyText,
    String bodyHtml,
    String sentAt,
    List<AttachmentSummaryDto> attachments
) {}
