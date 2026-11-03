package com.jiosi.inbox.security;

public record GoogleIdentity(
        String subject,
        String email,
        boolean emailVerified,
        String fullName,
        String avatarUrl
) {
    public GoogleIdentity {
        if (subject == null || subject.isBlank()) {
            throw new IllegalArgumentException("Google subject (sub) must not be blank");
        }
        if (email == null || email.isBlank()) {
            throw new IllegalArgumentException("Google email must not be blank");
        }
    }
}
