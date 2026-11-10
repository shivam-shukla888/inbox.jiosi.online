package com.jiosi.inbox.common;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.servlet.NoHandlerFoundException;

import java.util.List;

@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponse> handleValidationException(MethodArgumentNotValidException ex) {
        List<String> errors = ex.getBindingResult().getFieldErrors().stream()
                .map(FieldError::getDefaultMessage)
                .toList();
        log.warn("Validation failure: {}", errors);
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(ErrorResponse.of("Validation failed", "INVALID_ARGUMENT", errors));
    }

    @ExceptionHandler(org.springframework.web.method.annotation.MethodArgumentTypeMismatchException.class)
    public ResponseEntity<ErrorResponse> handleTypeMismatch(org.springframework.web.method.annotation.MethodArgumentTypeMismatchException ex) {
        log.warn("Parameter type mismatch for {}: {}", ex.getName(), ex.getValue());
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(ErrorResponse.of("Invalid value for parameter: " + ex.getName(), "INVALID_PARAMETER"));
    }

    @ExceptionHandler(org.springframework.web.bind.MissingRequestHeaderException.class)
    public ResponseEntity<ErrorResponse> handleMissingHeader(org.springframework.web.bind.MissingRequestHeaderException ex) {
        log.warn("Missing required request header: {}", ex.getHeaderName());
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(ErrorResponse.of("Missing required header: " + ex.getHeaderName(), "MISSING_HEADER"));
    }

    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<ErrorResponse> handleResourceNotFound(ResourceNotFoundException ex) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(ErrorResponse.of(ex.getMessage(), "NOT_FOUND"));
    }

    @ExceptionHandler(WorkspaceAccessDeniedException.class)
    public ResponseEntity<ErrorResponse> handleWorkspaceAccessDenied(WorkspaceAccessDeniedException ex) {
        return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body(ErrorResponse.of(ex.getMessage(), "WORKSPACE_ACCESS_DENIED"));
    }

    @ExceptionHandler(UnauthorizedException.class)
    public ResponseEntity<ErrorResponse> handleUnauthorized(UnauthorizedException ex) {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(ErrorResponse.of(ex.getMessage(), "UNAUTHORIZED"));
    }

    @ExceptionHandler(com.jiosi.inbox.gmail.GmailAuthRevokedException.class)
    public ResponseEntity<ErrorResponse> handleGmailAuthRevoked(com.jiosi.inbox.gmail.GmailAuthRevokedException ex) {
        log.warn("Gmail authorization revoked: {}", ex.getMessage());
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(ErrorResponse.of(ex.getMessage(), "GMAIL_AUTH_REVOKED"));
    }

    @ExceptionHandler(com.jiosi.inbox.gmail.GmailApiException.class)
    public ResponseEntity<ErrorResponse> handleGmailApiException(com.jiosi.inbox.gmail.GmailApiException ex) {
        log.warn("Gmail API error: {} (Status: {})", ex.getMessage(), ex.getStatusCode());
        HttpStatus status = HttpStatus.resolve(ex.getStatusCode());
        if (status == null) {
            status = HttpStatus.BAD_GATEWAY;
        }
        return ResponseEntity.status(status)
                .body(ErrorResponse.of(ex.getMessage(), "GMAIL_API_ERROR"));
    }

    @ExceptionHandler(com.jiosi.inbox.ai.client.GroqClient.GroqRateLimitException.class)
    public ResponseEntity<ErrorResponse> handleGroqRateLimit(com.jiosi.inbox.ai.client.GroqClient.GroqRateLimitException ex) {
        log.warn("Groq rate limit: {}", ex.getMessage());
        return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS)
                .body(ErrorResponse.of(ex.getMessage(), "AI_RATE_LIMIT"));
    }

    @ExceptionHandler(com.jiosi.inbox.ai.client.GroqClient.GroqUnavailableException.class)
    public ResponseEntity<ErrorResponse> handleGroqUnavailable(com.jiosi.inbox.ai.client.GroqClient.GroqUnavailableException ex) {
        log.warn("Groq service unavailable: {}", ex.getMessage());
        return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                .body(ErrorResponse.of(ex.getMessage(), "AI_SERVICE_UNAVAILABLE"));
    }

    @ExceptionHandler(com.jiosi.inbox.ai.client.GroqClient.GroqApiException.class)
    public ResponseEntity<ErrorResponse> handleGroqApiException(com.jiosi.inbox.ai.client.GroqClient.GroqApiException ex) {
        log.warn("Groq API error: {}", ex.getMessage());
        return ResponseEntity.status(HttpStatus.BAD_GATEWAY)
                .body(ErrorResponse.of(ex.getMessage(), "AI_API_ERROR"));
    }

    @ExceptionHandler(com.jiosi.inbox.ai.service.EmailIntelligenceService.AiConsentRequiredException.class)
    public ResponseEntity<ErrorResponse> handleAiConsentRequired(com.jiosi.inbox.ai.service.EmailIntelligenceService.AiConsentRequiredException ex) {
        log.info("AI consent required: {}", ex.getMessage());
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(ErrorResponse.of(ex.getMessage(), "AI_CONSENT_REQUIRED"));
    }

    @ExceptionHandler(NoHandlerFoundException.class)
    public ResponseEntity<ErrorResponse> handleNotFound(NoHandlerFoundException ex) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(ErrorResponse.of("Resource not found", "NOT_FOUND"));
    }

    @ExceptionHandler(org.springframework.web.HttpRequestMethodNotSupportedException.class)
    public ResponseEntity<ErrorResponse> handleMethodNotSupported(org.springframework.web.HttpRequestMethodNotSupportedException ex) {
        return ResponseEntity.status(HttpStatus.METHOD_NOT_ALLOWED)
                .body(ErrorResponse.of("HTTP method not allowed: " + ex.getMethod(), "METHOD_NOT_ALLOWED"));
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ErrorResponse> handleIllegalArgument(IllegalArgumentException ex) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(ErrorResponse.of(ex.getMessage(), "BAD_REQUEST"));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleGeneralException(Exception ex) {
        log.error("Unhandled internal server error", ex);
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ErrorResponse.of("An unexpected server error occurred", "INTERNAL_ERROR"));
    }
}
