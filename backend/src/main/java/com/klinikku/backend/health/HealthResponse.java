package com.klinikku.backend.health;

import java.time.Instant;
import java.util.List;

public record HealthResponse(
        String application,
        String status,
        Instant timestamp,
        List<String> modules,
        List<String> paymentMethods) {
}
