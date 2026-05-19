package com.klinikku.backend.appointment;

import jakarta.validation.constraints.NotNull;

public record AppointmentStatusRequest(
        @NotNull(message = "Appointment status is required")
        AppointmentStatus status,
        String cancelledReason) {
}
