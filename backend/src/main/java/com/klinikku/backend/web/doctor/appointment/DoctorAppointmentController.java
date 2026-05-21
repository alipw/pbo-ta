package com.klinikku.backend.web.doctor.appointment;

import com.klinikku.backend.appointment.AppointmentRequest;
import com.klinikku.backend.appointment.AppointmentResponse;
import com.klinikku.backend.appointment.AppointmentService;
import com.klinikku.backend.appointment.AppointmentStatus;
import com.klinikku.backend.appointment.AppointmentStatusRequest;
import com.klinikku.backend.auth.AuthenticatedUser;
import jakarta.validation.Valid;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Objects;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/doctor/appointments")
public class DoctorAppointmentController {

    private final AppointmentService appointmentService;

    public DoctorAppointmentController(AppointmentService appointmentService) {
        this.appointmentService = appointmentService;
    }

    @GetMapping
    public List<AppointmentResponse> listAppointments(
            @AuthenticationPrincipal AuthenticatedUser user,
            @RequestParam(required = false) Long patientId,
            @RequestParam(required = false) Long doctorId,
            @RequestParam(required = false) AppointmentStatus status,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) OffsetDateTime from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) OffsetDateTime to) {
        ensureRequestedDoctorMatchesAuthenticatedDoctor(user.id(), doctorId);
        return appointmentService.findAll(patientId, user.id(), status, from, to);
    }

    @GetMapping("/{appointmentId}")
    public AppointmentResponse getAppointment(
            @AuthenticationPrincipal AuthenticatedUser user,
            @PathVariable Long appointmentId) {
        return appointmentService.findResponseByIdForDoctor(appointmentId, user.id());
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public AppointmentResponse createAppointment(
            @AuthenticationPrincipal AuthenticatedUser user,
            @Valid @RequestBody AppointmentRequest request) {
        return appointmentService.createForDoctor(request, user.id());
    }

    @PutMapping("/{appointmentId}")
    public AppointmentResponse updateAppointment(
            @AuthenticationPrincipal AuthenticatedUser user,
            @PathVariable Long appointmentId,
            @Valid @RequestBody AppointmentRequest request) {
        return appointmentService.updateForDoctor(appointmentId, request, user.id());
    }

    @PatchMapping("/{appointmentId}/status")
    public AppointmentResponse updateAppointmentStatus(
            @AuthenticationPrincipal AuthenticatedUser user,
            @PathVariable Long appointmentId,
            @Valid @RequestBody AppointmentStatusRequest request) {
        return appointmentService.updateStatusForDoctor(
                appointmentId, user.id(), request.status(), request.cancelledReason());
    }

    @DeleteMapping("/{appointmentId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteAppointment(
            @AuthenticationPrincipal AuthenticatedUser user,
            @PathVariable Long appointmentId) {
        appointmentService.deleteByIdForDoctor(appointmentId, user.id());
    }

    private void ensureRequestedDoctorMatchesAuthenticatedDoctor(Long authenticatedDoctorId, Long requestedDoctorId) {
        if (requestedDoctorId != null && !Objects.equals(requestedDoctorId, authenticatedDoctorId)) {
            throw new AccessDeniedException("Doctors can only list their own appointments");
        }
    }
}
