package com.jiosi.inbox.email.dto;

public record SenderDto(
    String name,
    String email,
    String avatar,
    String role
) {}
