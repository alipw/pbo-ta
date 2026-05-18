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
        OffsetDateTime startsAt,
        OffsetDateTime endsAt,
        String room,
        String scheduleNotes,
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
                appointment.getSchedule() == null ? null : appointment.getSchedule().getStartsAt(),
                appointment.getSchedule() == null ? null : appointment.getSchedule().getEndsAt(),
                appointment.getSchedule() == null ? null : appointment.getSchedule().getRoom(),
                appointment.getSchedule() == null ? null : appointment.getSchedule().getNotes(),
                appointment.getStatus(),
                appointment.getBookedAt(),
                appointment.getComplaint(),
                appointment.getCancelledReason(),
                appointment.getCreatedAt(),
                appointment.getUpdatedAt());
    }
}
