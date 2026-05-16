package com.klinikku.backend.schedule;

import java.time.Instant;
import java.time.OffsetDateTime;

public record ScheduleResponse(
        Long id,
        Long doctorId,
        String doctorName,
        OffsetDateTime startsAt,
        OffsetDateTime endsAt,
        String room,
        ScheduleStatus status,
        String notes,
        Instant createdAt,
        Instant updatedAt) {

    public static ScheduleResponse from(DoctorSchedule schedule) {
        return new ScheduleResponse(
                schedule.getId(),
                schedule.getDoctor().getId(),
                schedule.getDoctor().getFullName(),
                schedule.getStartsAt(),
                schedule.getEndsAt(),
                schedule.getRoom(),
                schedule.getStatus(),
                schedule.getNotes(),
                schedule.getCreatedAt(),
                schedule.getUpdatedAt());
    }
}
