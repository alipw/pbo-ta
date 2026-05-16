package com.klinikku.backend.appointment;

import jakarta.validation.constraints.NotNull;
import java.time.OffsetDateTime;

public record AppointmentRequest(
        @NotNull(message = "Patient id is required")
        Long patientId,
        @NotNull(message = "Doctor id is required")
        Long doctorId,
        Long scheduleId,
        OffsetDateTime bookedAt,
        AppointmentStatus status,
        String complaint,
        String cancelledReason) {
}
