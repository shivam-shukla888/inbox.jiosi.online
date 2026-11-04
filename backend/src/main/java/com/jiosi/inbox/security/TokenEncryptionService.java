package com.jiosi.inbox.security;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.Cipher;
import javax.crypto.SecretKey;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.SecretKeySpec;
import java.nio.ByteBuffer;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.util.Base64;

/**
 * Enterprise AES-256-GCM Encryption Service for securing OAuth tokens at rest.
 * Ensures zero plaintext token exposure in PostgreSQL database.
 */
@Service
public class TokenEncryptionService {

    private static final Logger log = LoggerFactory.getLogger(TokenEncryptionService.class);
    private static final String ALGORITHM = "AES/GCM/NoPadding";
    private static final int GCM_IV_LENGTH_BYTES = 12; // 96-bit recommended IV for AES-GCM
    private static final int GCM_TAG_LENGTH_BITS = 128; // 128-bit authentication tag

    private final SecretKey secretKey;
    private final SecureRandom secureRandom;

    public TokenEncryptionService(
            @Value("${app.security.jwt-secret:${JWT_SECRET:jiosi_default_development_hmac_secret_key_minimum_32_bytes_long}}") String rawKey
    ) {
        this.secureRandom = new SecureRandom();
        this.secretKey = deriveAesKey(rawKey);
    }

    /**
     * Encrypts plaintext string into a Base64 payload containing IV + Ciphertext + Auth Tag.
     */
    public String encrypt(String plaintext) {
        if (plaintext == null || plaintext.isBlank()) {
            return null;
        }

        try {
            byte[] iv = new byte[GCM_IV_LENGTH_BYTES];
            secureRandom.nextBytes(iv);

            Cipher cipher = Cipher.getInstance(ALGORITHM);
            GCMParameterSpec spec = new GCMParameterSpec(GCM_TAG_LENGTH_BITS, iv);
            cipher.init(Cipher.ENCRYPT_MODE, secretKey, spec);

            byte[] cipherText = cipher.doFinal(plaintext.getBytes(StandardCharsets.UTF_8));

            ByteBuffer byteBuffer = ByteBuffer.allocate(iv.length + cipherText.length);
            byteBuffer.put(iv);
            byteBuffer.put(cipherText);

            return Base64.getEncoder().encodeToString(byteBuffer.array());
        } catch (Exception e) {
            log.error("Failed to encrypt token payload: {}", e.getMessage());
            throw new IllegalStateException("Cryptographic encryption failure", e);
        }
    }

    /**
     * Decrypts Base64 payload containing IV + Ciphertext + Auth Tag into plaintext string.
     */
    public String decrypt(String encryptedPayload) {
        if (encryptedPayload == null || encryptedPayload.isBlank()) {
            return null;
        }

        try {
            byte[] decoded = Base64.getDecoder().decode(encryptedPayload);
            if (decoded.length < GCM_IV_LENGTH_BYTES) {
                throw new IllegalArgumentException("Invalid encrypted payload length");
            }

            ByteBuffer byteBuffer = ByteBuffer.wrap(decoded);
            byte[] iv = new byte[GCM_IV_LENGTH_BYTES];
            byteBuffer.get(iv);

            byte[] cipherText = new byte[byteBuffer.remaining()];
            byteBuffer.get(cipherText);

            Cipher cipher = Cipher.getInstance(ALGORITHM);
            GCMParameterSpec spec = new GCMParameterSpec(GCM_TAG_LENGTH_BITS, iv);
            cipher.init(Cipher.DECRYPT_MODE, secretKey, spec);

            byte[] plainTextBytes = cipher.doFinal(cipherText);
            return new String(plainTextBytes, StandardCharsets.UTF_8);
        } catch (Exception e) {
            log.error("Failed to decrypt token payload: {}", e.getMessage());
            throw new IllegalStateException("Cryptographic decryption failure: data invalid or key mismatch", e);
        }
    }

    private SecretKey deriveAesKey(String rawSecret) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(rawSecret.getBytes(StandardCharsets.UTF_8));
            return new SecretKeySpec(hash, "AES");
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 algorithm missing from Java security runtime", e);
        }
    }
}

