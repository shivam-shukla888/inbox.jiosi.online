package com.jiosi.inbox.email.dto;

import java.util.List;

public record PagedThreadsResponse(
    List<ThreadSummaryDto> threads,
    int pageNumber,
    int pageSize,
    long totalElements,
    int totalPages,
    boolean isFirst,
    boolean isLast,
    FolderCountsDto folderCounts
) {}
