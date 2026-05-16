package com.klinikku.backend.appointment;

import java.time.Instant;
import java.time.OffsetDateTime;

public record AppointmentResponse(
        Long id,
        Long patientId,
        String patientName,
        Long doctorId,
        String doctorName,
        Long scheduleId,
        AppointmentStatus status,
        OffsetDateTime bookedAt,
        String complaint,
        String cancelledReason,
        Instant createdAt,
        Instant updatedAt) {

    public static AppointmentResponse from(Appointment appointment) {
        return new AppointmentResponse(
                appointment.getId(),
                appointment.getPatient().getId(),
                appointment.getPatient().getFullName(),
                appointment.getDoctor().getId(),
                appointment.getDoctor().getFullName(),
                appointment.getSchedule() == null ? null : appointment.getSchedule().getId(),
                appointment.getStatus(),
                appointment.getBookedAt(),
                appointment.getComplaint(),
                appointment.getCancelledReason(),
                appointment.getCreatedAt(),
                appointment.getUpdatedAt());
    }
}
