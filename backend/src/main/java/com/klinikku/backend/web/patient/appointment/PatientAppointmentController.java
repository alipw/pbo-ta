package com.klinikku.backend.web.patient.appointment;

import com.klinikku.backend.appointment.AppointmentResponse;
import com.klinikku.backend.appointment.AppointmentService;
import com.klinikku.backend.appointment.AppointmentStatus;
import com.klinikku.backend.appointment.PatientAppointmentCancelRequest;
import com.klinikku.backend.appointment.PatientAppointmentRequest;
import com.klinikku.backend.auth.AuthenticatedUser;
import jakarta.validation.Valid;
import java.time.OffsetDateTime;
import java.util.List;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/patient/appointments")
public class PatientAppointmentController {

    private final AppointmentService appointmentService;

    public PatientAppointmentController(AppointmentService appointmentService) {
        this.appointmentService = appointmentService;
    }

    @GetMapping
    public List<AppointmentResponse> listAppointments(
            @AuthenticationPrincipal AuthenticatedUser user,
            @RequestParam(required = false) Long doctorId,
            @RequestParam(required = false) AppointmentStatus status,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) OffsetDateTime from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) OffsetDateTime to) {
        return appointmentService.findAll(user.id(), doctorId, status, from, to);
    }

    @GetMapping("/{appointmentId}")
    public AppointmentResponse getAppointment(
            @AuthenticationPrincipal AuthenticatedUser user,
            @PathVariable Long appointmentId) {
        return appointmentService.findResponseByIdForPatient(appointmentId, user.id());
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public AppointmentResponse requestAppointment(
            @AuthenticationPrincipal AuthenticatedUser user,
            @Valid @RequestBody PatientAppointmentRequest request) {
        return appointmentService.createForPatient(user.id(), request);
    }

    @PatchMapping("/{appointmentId}/cancel")
    public AppointmentResponse cancelAppointment(
            @AuthenticationPrincipal AuthenticatedUser user,
            @PathVariable Long appointmentId,
            @RequestBody PatientAppointmentCancelRequest request) {
        return appointmentService.cancelForPatient(appointmentId, user.id(), request.cancelledReason());
    }
}
