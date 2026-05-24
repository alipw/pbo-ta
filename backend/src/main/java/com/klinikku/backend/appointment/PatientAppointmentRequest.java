package com.klinikku.backend.appointment;

import jakarta.validation.constraints.NotNull;

public record PatientAppointmentRequest(
        @NotNull(message = "Schedule id is required")
        Long scheduleId,
        String complaint) {
}
