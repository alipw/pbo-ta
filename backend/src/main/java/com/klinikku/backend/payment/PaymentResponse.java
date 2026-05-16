package com.klinikku.backend.payment;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.OffsetDateTime;

public record PaymentResponse(
        Long id,
        Long appointmentId,
        BigDecimal amount,
        PaymentStatus status,
        PaymentMethodType methodType,
        String methodDisplayName,
        String referenceNumber,
        OffsetDateTime paidAt,
        Instant createdAt,
        Instant updatedAt) {

    public static PaymentResponse from(Payment payment) {
        String methodDisplayName = PaymentMethodCatalog.supportedMethods().stream()
                .filter(method -> method.type() == payment.getMethodType())
                .findFirst()
                .map(PaymentMethod::displayName)
                .orElse(payment.getMethodType().name());

        return new PaymentResponse(
                payment.getId(),
                payment.getAppointment().getId(),
                payment.getAmount(),
                payment.getStatus(),
                payment.getMethodType(),
                methodDisplayName,
                payment.getReferenceNumber(),
                payment.getPaidAt(),
                payment.getCreatedAt(),
                payment.getUpdatedAt());
    }
}
