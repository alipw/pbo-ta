package com.klinikku.backend.medicalrecord;

import java.time.Instant;
import java.time.OffsetDateTime;

public record MedicalRecordResponse(
        Long id,
        Long appointmentId,
        OffsetDateTime appointmentDate,
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
                appointmentDate(record),
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

    private static OffsetDateTime appointmentDate(MedicalRecord record) {
        if (record.getAppointment().getSchedule() != null) {
            return record.getAppointment().getSchedule().getStartsAt();
        }

        return record.getAppointment().getBookedAt();
    }
}
