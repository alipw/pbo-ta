package com.klinikku.backend.payment;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.OffsetDateTime;

public record PaymentResponse(
        Long id,
        Long appointmentId,
        OffsetDateTime appointmentDate,
        Long patientId,
        String patientName,
        Long doctorId,
        String doctorName,
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
                appointmentDate(payment),
                payment.getAppointment().getPatient().getId(),
                payment.getAppointment().getPatient().getFullName(),
                payment.getAppointment().getDoctor().getId(),
                payment.getAppointment().getDoctor().getFullName(),
                payment.getAmount(),
                payment.getStatus(),
                payment.getMethodType(),
                methodDisplayName,
                payment.getReferenceNumber(),
                payment.getPaidAt(),
                payment.getCreatedAt(),
                payment.getUpdatedAt());
    }

    private static OffsetDateTime appointmentDate(Payment payment) {
        if (payment.getAppointment().getSchedule() != null) {
            return payment.getAppointment().getSchedule().getStartsAt();
        }

        return payment.getAppointment().getBookedAt();
    }
}
