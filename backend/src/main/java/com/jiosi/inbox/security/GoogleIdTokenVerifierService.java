package com.jiosi.inbox.security;

import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;
import com.jiosi.inbox.common.UnauthorizedException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.env.Environment;
import org.springframework.stereotype.Service;

import java.util.Arrays;
import java.util.Collections;
import java.util.List;

@Service
public class GoogleIdTokenVerifierService {

    private static final Logger log = LoggerFactory.getLogger(GoogleIdTokenVerifierService.class);

    private final String expectedClientId;
    private final boolean isTestEnvironment;
    private final GoogleIdTokenVerifier verifier;

    public GoogleIdTokenVerifierService(
            @Value("${app.google.client-id:}") String expectedClientId,
            Environment environment
    ) {
        this.expectedClientId = (expectedClientId != null) ? expectedClientId.trim() : "";
        this.isTestEnvironment = Arrays.asList(environment.getActiveProfiles()).contains("test");

        if (this.expectedClientId.isEmpty() || "google-client-id-placeholder".equals(this.expectedClientId) || isTestEnvironment) {
            this.verifier = null;
        } else {
            this.verifier = new GoogleIdTokenVerifier.Builder(new NetHttpTransport(), GsonFactory.getDefaultInstance())
                    .setAudience(Collections.singletonList(this.expectedClientId))
                    .build();
        }
    }

    public GoogleIdentity verify(String idTokenString) {
        if (idTokenString == null || idTokenString.isBlank()) {
            throw new UnauthorizedException("Google ID token is required");
        }

        String token = idTokenString.trim();

        // Controlled test harness support for offline unit & integration tests
        if (isTestEnvironment && token.startsWith("test-google-token:")) {
            return parseTestToken(token);
        }

        if (verifier == null) {
            if (isTestEnvironment) {
                throw new UnauthorizedException("Google ID token verification failed: test token format invalid");
            }
            throw new IllegalStateException("Google OAuth client ID is not configured on the server");
        }

        try {
            GoogleIdToken idToken = verifier.verify(token);
            if (idToken == null) {
                log.warn("Google ID token verification failed: invalid signature, expired, or audience mismatch");
                throw new UnauthorizedException("Invalid or expired Google ID token");
            }

            GoogleIdToken.Payload payload = idToken.getPayload();

            // 1. Verify Audience
            if (!expectedClientId.equals(payload.getAuthorizedParty()) && !expectedClientId.equals(payload.getAudience())) {
                log.warn("Google ID token audience mismatch: expected {}, got aud={}, azp={}",
                        expectedClientId, payload.getAudience(), payload.getAuthorizedParty());
                throw new UnauthorizedException("Google ID token audience mismatch");
            }

            // 2. Verify Issuer
            String issuer = payload.getIssuer();
            if (!"https://accounts.google.com".equals(issuer) && !"accounts.google.com".equals(issuer)) {
                log.warn("Google ID token invalid issuer: {}", issuer);
                throw new UnauthorizedException("Invalid Google ID token issuer");
            }

            // 3. Verify Email Verification Claim
            Boolean emailVerified = payload.getEmailVerified();
            if (emailVerified == null || !emailVerified) {
                log.warn("Google user email is not verified: {}", payload.getEmail());
                throw new UnauthorizedException("Google account email is not verified");
            }

            String subject = payload.getSubject();
            String email = payload.getEmail();
            String name = (String) payload.get("name");
            String picture = (String) payload.get("picture");

            return new GoogleIdentity(
                    subject,
                    email,
                    true,
                    name != null ? name : email,
                    picture
            );

        } catch (UnauthorizedException ue) {
            throw ue;
        } catch (Exception e) {
            log.error("Exception during Google ID token verification: {}", e.getMessage(), e);
            throw new UnauthorizedException("Google ID token validation failed: " + e.getMessage());
        }
    }

    private GoogleIdentity parseTestToken(String token) {
        // Format: test-google-token:<sub|error>:<email>:<name>:<verified:true|false>
        String[] parts = token.split(":", 5);
        if (parts.length >= 2 && "error".equalsIgnoreCase(parts[1])) {
            throw new UnauthorizedException("Simulated invalid Google token for testing");
        }
        if (parts.length >= 2 && "expired".equalsIgnoreCase(parts[1])) {
            throw new UnauthorizedException("Invalid or expired Google ID token");
        }
        if (parts.length >= 2 && "audience-mismatch".equalsIgnoreCase(parts[1])) {
            throw new UnauthorizedException("Google ID token audience mismatch");
        }

        String sub = parts.length > 1 ? parts[1] : "google-sub-12345";
        String email = parts.length > 2 ? parts[2] : "user@example.com";
        String name = parts.length > 3 ? parts[3] : "Test User";
        boolean verified = parts.length <= 4 || Boolean.parseBoolean(parts[4]);

        if (!verified) {
            throw new UnauthorizedException("Google account email is not verified");
        }

        return new GoogleIdentity(sub, email, true, name, null);
    }
}
