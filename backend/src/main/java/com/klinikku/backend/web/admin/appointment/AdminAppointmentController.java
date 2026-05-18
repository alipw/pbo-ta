package com.klinikku.backend.web.admin.appointment;

import com.klinikku.backend.appointment.AppointmentRequest;
import com.klinikku.backend.appointment.AppointmentResponse;
import com.klinikku.backend.appointment.AppointmentService;
import com.klinikku.backend.appointment.AppointmentStatus;
import jakarta.validation.Valid;
import java.time.OffsetDateTime;
import java.util.List;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/admin/appointments")
public class AdminAppointmentController {

    private final AppointmentService appointmentService;

    public AdminAppointmentController(AppointmentService appointmentService) {
        this.appointmentService = appointmentService;
    }

    @GetMapping
    public List<AppointmentResponse> listAppointments(
            @RequestParam(required = false) Long patientId,
            @RequestParam(required = false) Long doctorId,
            @RequestParam(required = false) AppointmentStatus status,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) OffsetDateTime from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) OffsetDateTime to) {
        return appointmentService.findAll(patientId, doctorId, status, from, to);
    }

    @GetMapping("/{appointmentId}")
    public AppointmentResponse getAppointment(@PathVariable Long appointmentId) {
        return appointmentService.findResponseById(appointmentId);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public AppointmentResponse createAppointment(@Valid @RequestBody AppointmentRequest request) {
        return appointmentService.create(request);
    }

    @PutMapping("/{appointmentId}")
    public AppointmentResponse updateAppointment(
            @PathVariable Long appointmentId,
            @Valid @RequestBody AppointmentRequest request) {
        return appointmentService.update(appointmentId, request);
    }

    @DeleteMapping("/{appointmentId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteAppointment(@PathVariable Long appointmentId) {
        appointmentService.deleteById(appointmentId);
    }
}
