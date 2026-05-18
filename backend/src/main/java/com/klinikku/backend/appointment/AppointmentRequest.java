package com.klinikku.backend.appointment;

import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.NotNull;
import java.time.OffsetDateTime;

public record AppointmentRequest(
        @NotNull(message = "Patient id is required")
        Long patientId,
        @NotNull(message = "Doctor id is required")
        Long doctorId,
        @NotNull(message = "Appointment start is required")
        @Future(message = "Appointment start must be in the future")
        OffsetDateTime startsAt,
        @NotNull(message = "Appointment end is required")
        @Future(message = "Appointment end must be in the future")
        OffsetDateTime endsAt,
        String room,
        String scheduleNotes,
        AppointmentStatus status,
        String complaint,
        String cancelledReason) {
}
