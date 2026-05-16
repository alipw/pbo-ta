package com.klinikku.backend.payment;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.time.OffsetDateTime;

public record PaymentRequest(
        @NotNull(message = "Appointment id is required")
        Long appointmentId,
        @NotNull(message = "Payment amount is required")
        @DecimalMin(value = "0.0", inclusive = false, message = "Payment amount must be positive")
        BigDecimal amount,
        PaymentStatus status,
        @NotNull(message = "Payment method is required")
        PaymentMethodType methodType,
        String referenceNumber,
        OffsetDateTime paidAt) {
}
