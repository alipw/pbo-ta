package com.klinikku.backend.medicalrecord;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record MedicalRecordRequest(
        @NotNull(message = "Appointment id is required")
        Long appointmentId,
        @NotBlank(message = "Diagnosis is required")
        String diagnosis,
        String symptoms,
        String treatmentNotes) {
}
