package com.jiosi.inbox.common;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.servlet.NoHandlerFoundException;

import static org.junit.jupiter.api.Assertions.*;

class GlobalExceptionHandlerTest {

    private GlobalExceptionHandler exceptionHandler;

    @BeforeEach
    void setUp() {
        exceptionHandler = new GlobalExceptionHandler();
    }

    @Test
    void testHandleIllegalArgumentException_ShouldReturn400AndErrorMessage() {
        IllegalArgumentException ex = new IllegalArgumentException("Invalid email format");

        ResponseEntity<ErrorResponse> response = exceptionHandler.handleIllegalArgument(ex);

        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
        assertNotNull(response.getBody());
        assertFalse(response.getBody().success());
        assertEquals("Invalid email format", response.getBody().message());
        assertEquals("BAD_REQUEST", response.getBody().code());
    }

    @Test
    void testHandleNotFound_ShouldReturn404AndNotFoundError() {
        NoHandlerFoundException ex = new NoHandlerFoundException("GET", "/api/v1/unknown", null);

        ResponseEntity<ErrorResponse> response = exceptionHandler.handleNotFound(ex);

        assertEquals(HttpStatus.NOT_FOUND, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals("Resource not found", response.getBody().message());
        assertEquals("NOT_FOUND", response.getBody().code());
    }

    @Test
    void testHandleGeneralException_ShouldReturn500WithoutLeakingInternalStackTrace() {
        RuntimeException ex = new RuntimeException("NullPointerException in deep service");

        ResponseEntity<ErrorResponse> response = exceptionHandler.handleGeneralException(ex);

        assertEquals(HttpStatus.INTERNAL_SERVER_ERROR, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals("An unexpected server error occurred", response.getBody().message());
        assertEquals("INTERNAL_ERROR", response.getBody().code());
        // Verify details list is empty and does not expose stack trace details
        assertTrue(response.getBody().details().isEmpty());
    }
}
