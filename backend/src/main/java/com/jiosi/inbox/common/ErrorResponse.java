package com.jiosi.inbox.common;

import java.time.Instant;
import java.util.List;

public record ErrorResponse(
    boolean success,
    String message,
    String code,
    List<String> details,
    Instant timestamp
) {
    public static ErrorResponse of(String message, String code, List<String> details) {
        return new ErrorResponse(false, message, code, details, Instant.now());
    }

    public static ErrorResponse of(String message, String code) {
        return new ErrorResponse(false, message, code, List.of(), Instant.now());
    }
}
