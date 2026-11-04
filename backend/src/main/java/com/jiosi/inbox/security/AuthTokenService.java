package com.jiosi.inbox.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.jiosi.inbox.common.UnauthorizedException;
import com.jiosi.inbox.user.User;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.env.Environment;
import org.springframework.stereotype.Service;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Arrays;
import java.util.Base64;
import java.util.Map;
import java.util.UUID;

@Service
public class AuthTokenService {

    private static final Logger log = LoggerFactory.getLogger(AuthTokenService.class);
    private static final String HMAC_ALGO = "HmacSHA256";
    private static final String TOKEN_ISSUER = "https://inbox.jiosi.online";
    private static final String TOKEN_AUDIENCE = "jiosi-inbox-client";
    private static final String DEFAULT_DEV_SECRET = "jiosi_default_development_hmac_secret_key_minimum_32_bytes_long";

    private final byte[] secretKeyBytes;
    private final long tokenExpirationSeconds;
    private final ObjectMapper objectMapper;

    public AuthTokenService(
            @Value("${app.security.jwt-secret:jiosi_default_development_hmac_secret_key_minimum_32_bytes_long}") String secret,
            @Value("${app.security.jwt-expiration-seconds:3600}") long tokenExpirationSeconds,
            Environment environment,
            ObjectMapper objectMapper
    ) {
        boolean isProd = Arrays.asList(environment.getActiveProfiles()).contains("prod")
                || Arrays.asList(environment.getActiveProfiles()).contains("production");

        if (isProd && DEFAULT_DEV_SECRET.equals(secret)) {
            log.error("SECURITY CRITICAL: Default HMAC secret detected in production profile! Aborting startup.");
            throw new IllegalStateException("Production environment must define a secure, non-default JWT_SECRET");
        }

        this.secretKeyBytes = secret.getBytes(StandardCharsets.UTF_8);
        this.tokenExpirationSeconds = tokenExpirationSeconds;
        this.objectMapper = objectMapper;
    }

    public String generateToken(User user) {
        try {
            long now = Instant.now().getEpochSecond();
            long exp = now + tokenExpirationSeconds;

            Map<String, Object> payload = Map.of(
                    "sub", user.getId().toString(),
                    "email", user.getEmail(),
                    "name", user.getFullName(),
                    "iss", TOKEN_ISSUER,
                    "aud", TOKEN_AUDIENCE,
                    "jti", UUID.randomUUID().toString(),
                    "iat", now,
                    "exp", exp
            );

            String headerB64 = Base64.getUrlEncoder().withoutPadding().encodeToString(
                    "{\"alg\":\"HS256\",\"typ\":\"JWT\"}".getBytes(StandardCharsets.UTF_8)
            );
            String payloadB64 = Base64.getUrlEncoder().withoutPadding().encodeToString(
                    objectMapper.writeValueAsBytes(payload)
            );
            String signature = sign(headerB64 + "." + payloadB64);

            return headerB64 + "." + payloadB64 + "." + signature;
        } catch (Exception e) {
            log.error("Failed to generate token for user {}", user.getId(), e);
            throw new RuntimeException("Token generation failure", e);
        }
    }

    public UUID validateAndExtractUserId(String authHeader) {
        if (authHeader == null || authHeader.isBlank()) {
            throw new UnauthorizedException("Missing Authorization header");
        }

        String token = authHeader.trim();
        if (token.startsWith("Bearer ")) {
            token = token.substring(7).trim();
        }

        String[] parts = token.split("\\.");
        if (parts.length != 3) {
            throw new UnauthorizedException("Malformed authentication token");
        }

        String headerB64 = parts[0];
        String payloadB64 = parts[1];
        String signature = parts[2];

        String expectedSignature = sign(headerB64 + "." + payloadB64);
        if (!constantTimeEquals(signature, expectedSignature)) {
            throw new UnauthorizedException("Invalid token signature");
        }

        try {
            byte[] payloadBytes = Base64.getUrlDecoder().decode(payloadB64);
            @SuppressWarnings("unchecked")
            Map<String, Object> claims = objectMapper.readValue(payloadBytes, Map.class);

            Number exp = (Number) claims.get("exp");
            if (exp != null && Instant.now().getEpochSecond() > exp.longValue()) {
                throw new UnauthorizedException("Token has expired");
            }

            String sub = (String) claims.get("sub");
            if (sub == null) {
                throw new UnauthorizedException("Token missing subject");
            }

            return UUID.fromString(sub);
        } catch (UnauthorizedException ue) {
            throw ue;
        } catch (Exception e) {
            log.warn("Token payload decoding failed: {}", e.getMessage());
            throw new UnauthorizedException("Invalid token payload");
        }
    }

    private String sign(String data) {
        try {
            Mac mac = Mac.getInstance(HMAC_ALGO);
            SecretKeySpec secretKey = new SecretKeySpec(secretKeyBytes, HMAC_ALGO);
            mac.init(secretKey);
            byte[] rawHmac = mac.doFinal(data.getBytes(StandardCharsets.UTF_8));
            return Base64.getUrlEncoder().withoutPadding().encodeToString(rawHmac);
        } catch (Exception e) {
            throw new RuntimeException("HMAC computation failed", e);
        }
    }

    private boolean constantTimeEquals(String a, String b) {
        if (a == null || b == null) return false;
        if (a.length() != b.length()) return false;
        int result = 0;
        for (int i = 0; i < a.length(); i++) {
            result |= a.charAt(i) ^ b.charAt(i);
        }
        return result == 0;
    }
}
