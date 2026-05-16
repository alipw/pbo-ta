package com.klinikku.backend.health;

import com.klinikku.backend.payment.PaymentMethodCatalog;
import java.time.Instant;
import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/health")
public class HealthController {

    @GetMapping
    public HealthResponse getHealth() {
        return new HealthResponse(
                "klinikku-backend",
                "UP",
                Instant.now(),
                List.of("accounts", "schedules", "appointments", "records", "payments"),
                PaymentMethodCatalog.supportedMethods().stream().map(method -> method.displayName()).toList());
    }
}
