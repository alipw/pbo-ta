package com.klinikku.backend.payment;

import jakarta.validation.constraints.NotNull;
import java.time.OffsetDateTime;

public record PaymentStatusRequest(
        @NotNull(message = "Payment status is required")
        PaymentStatus status,
        PaymentMethodType methodType,
        String referenceNumber,
        OffsetDateTime paidAt) {
}
