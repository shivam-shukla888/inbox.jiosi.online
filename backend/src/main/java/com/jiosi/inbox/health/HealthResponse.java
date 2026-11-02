package com.jiosi.inbox.health;

import java.time.Instant;
import java.util.Map;

public record HealthResponse(
    String status,
    String application,
    String version,
    String environment,
    Instant timestamp,
    long uptimeMs,
    Map<String, Object> services
) {}
