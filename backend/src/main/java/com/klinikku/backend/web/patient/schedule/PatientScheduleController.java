package com.klinikku.backend.web.patient.schedule;

import com.klinikku.backend.schedule.ScheduleResponse;
import com.klinikku.backend.schedule.ScheduleService;
import java.time.OffsetDateTime;
import java.util.List;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/patient/schedules")
public class PatientScheduleController {

    private final ScheduleService scheduleService;

    public PatientScheduleController(ScheduleService scheduleService) {
        this.scheduleService = scheduleService;
    }

    @GetMapping("/available")
    public List<ScheduleResponse> listAvailableSchedules(
            @RequestParam(required = false) Long doctorId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) OffsetDateTime from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) OffsetDateTime to) {
        return scheduleService.findAvailableUnassigned(doctorId, from, to);
    }
}
