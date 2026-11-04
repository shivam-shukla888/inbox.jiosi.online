package com.jiosi.inbox.gmail;

public class GmailApiException extends RuntimeException {
    private final int statusCode;

    public GmailApiException(String message, int statusCode) {
        super(message);
        this.statusCode = statusCode;
    }

    public GmailApiException(String message, Throwable cause, int statusCode) {
        super(message, cause);
        this.statusCode = statusCode;
    }

    public int getStatusCode() {
        return statusCode;
    }
}

