package com.jiosi.inbox.email.dto;

public record AttachmentSummaryDto(
    String id,
    String filename,
    String size,
    String type
) {}
