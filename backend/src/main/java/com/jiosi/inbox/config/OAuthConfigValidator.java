package com.jiosi.inbox.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.env.Environment;
import org.springframework.stereotype.Component;

import java.util.Arrays;

@Component
public class OAuthConfigValidator implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(OAuthConfigValidator.class);

    private final String clientId;
    private final String clientSecret;
    private final Environment environment;

    public OAuthConfigValidator(
            @Value("${spring.security.oauth2.client.registration.google.client-id:}") String clientId,
            @Value("${spring.security.oauth2.client.registration.google.client-secret:}") String clientSecret,
            Environment environment
    ) {
        this.clientId = clientId != null ? clientId.trim() : "";
        this.clientSecret = clientSecret != null ? clientSecret.trim() : "";
        this.environment = environment;
    }

    @Override
    public void run(String... args) {
        boolean isTest = Arrays.asList(environment.getActiveProfiles()).contains("test");
        if (isTest) {
            return;
        }

        if (clientId.isEmpty() || "google-client-id-placeholder".equalsIgnoreCase(clientId)) {
            log.error("CRITICAL CONFIGURATION ERROR: GOOGLE_CLIENT_ID is not configured or contains placeholder.");
            throw new IllegalStateException("CRITICAL CONFIGURATION ERROR: GOOGLE_CLIENT_ID is missing or invalid. Please configure GOOGLE_CLIENT_ID in your .env file or environment.");
        }

        if (clientSecret.isEmpty() || "google-client-secret-placeholder".equalsIgnoreCase(clientSecret)) {
            log.error("CRITICAL CONFIGURATION ERROR: GOOGLE_CLIENT_SECRET is not configured or contains placeholder.");
            throw new IllegalStateException("CRITICAL CONFIGURATION ERROR: GOOGLE_CLIENT_SECRET is missing or invalid. Please configure GOOGLE_CLIENT_SECRET in your .env file or environment.");
        }

        log.info("Google OAuth2 Client Configuration successfully validated (Client ID ends with: ...{})",
                clientId.length() > 10 ? clientId.substring(clientId.length() - 10) : "***");
    }
}

