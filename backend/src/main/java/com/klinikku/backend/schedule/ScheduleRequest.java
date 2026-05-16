package com.klinikku.backend.schedule;

import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.NotNull;
import java.time.OffsetDateTime;

public record ScheduleRequest(
        @NotNull(message = "Doctor id is required")
        Long doctorId,
        @NotNull(message = "Schedule start is required")
        @Future(message = "Schedule start must be in the future")
        OffsetDateTime startsAt,
        @NotNull(message = "Schedule end is required")
        @Future(message = "Schedule end must be in the future")
        OffsetDateTime endsAt,
        String room,
        ScheduleStatus status,
        String notes) {
}
