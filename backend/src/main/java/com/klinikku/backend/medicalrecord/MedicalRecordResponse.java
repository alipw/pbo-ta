package com.klinikku.backend.medicalrecord;

import java.time.Instant;

public record MedicalRecordResponse(
        Long id,
        Long appointmentId,
        Long patientId,
        String patientName,
        Long doctorId,
        String doctorName,
        String symptoms,
        String diagnosis,
        String treatmentNotes,
        Instant createdAt,
        Instant updatedAt) {

    public static MedicalRecordResponse from(MedicalRecord record) {
        return new MedicalRecordResponse(
                record.getId(),
                record.getAppointment().getId(),
                record.getPatient().getId(),
                record.getPatient().getFullName(),
                record.getDoctor().getId(),
                record.getDoctor().getFullName(),
                record.getSymptoms(),
                record.getDiagnosis(),
                record.getTreatmentNotes(),
                record.getCreatedAt(),
                record.getUpdatedAt());
    }
}
