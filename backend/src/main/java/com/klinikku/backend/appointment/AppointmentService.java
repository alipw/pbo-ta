package com.klinikku.backend.appointment;

import com.klinikku.backend.common.ResourceNotFoundException;
import com.klinikku.backend.doctor.Doctor;
import com.klinikku.backend.doctor.DoctorService;
import com.klinikku.backend.patient.Patient;
import com.klinikku.backend.patient.PatientService;
import com.klinikku.backend.schedule.DoctorSchedule;
import com.klinikku.backend.schedule.ScheduleRequest;
import com.klinikku.backend.schedule.ScheduleService;
import java.time.OffsetDateTime;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AppointmentService {

    private final AppointmentRepository appointmentRepository;
    private final PatientService patientService;
    private final DoctorService doctorService;
    private final ScheduleService scheduleService;

    public AppointmentService(
            AppointmentRepository appointmentRepository,
            PatientService patientService,
            DoctorService doctorService,
            ScheduleService scheduleService) {
        this.appointmentRepository = appointmentRepository;
        this.patientService = patientService;
        this.doctorService = doctorService;
        this.scheduleService = scheduleService;
    }

    @Transactional(readOnly = true)
    public List<AppointmentResponse> findAll() {
        return findAll(null, null, null, null, null);
    }

    @Transactional(readOnly = true)
    public List<AppointmentResponse> findAll(
            Long patientId,
            Long doctorId,
            AppointmentStatus status,
            OffsetDateTime from,
            OffsetDateTime to) {
        if (from != null && to != null && to.isBefore(from)) {
            throw new IllegalArgumentException("Appointment filter end must be after start");
        }

        return appointmentRepository.findByFilters(patientId, doctorId, status, from, to).stream()
                .map(AppointmentResponse::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public Appointment findById(Long appointmentId) {
        return appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Appointment", appointmentId));
    }

    @Transactional(readOnly = true)
    public AppointmentResponse findResponseById(Long appointmentId) {
        return AppointmentResponse.from(findById(appointmentId));
    }

    @Transactional
    public AppointmentResponse create(AppointmentRequest request) {
        Appointment appointment = new Appointment();
        applyRequest(appointment, request);

        return AppointmentResponse.from(appointmentRepository.save(appointment));
    }

    @Transactional
    public AppointmentResponse update(Long appointmentId, AppointmentRequest request) {
        Appointment appointment = findById(appointmentId);
        applyRequest(appointment, request);

        return AppointmentResponse.from(appointmentRepository.save(appointment));
    }

    @Transactional
    public AppointmentResponse updateStatus(
            Long appointmentId,
            AppointmentStatus status,
            String cancelledReason) {
        Appointment appointment = findById(appointmentId);

        appointment.setStatus(status);
        appointment.setCancelledReason(status == AppointmentStatus.DIBATALKAN ? cancelledReason : null);

        return AppointmentResponse.from(appointmentRepository.save(appointment));
    }

    @Transactional
    public void deleteById(Long appointmentId) {
        Appointment appointment = findById(appointmentId);
        DoctorSchedule schedule = appointment.getSchedule();

        appointmentRepository.delete(appointment);
        if (schedule != null) {
            appointmentRepository.flush();
            scheduleService.deleteBookedSlot(schedule);
        }
    }

    private void applyRequest(Appointment appointment, AppointmentRequest request) {
        Patient patient = patientService.findById(request.patientId());
        Doctor doctor = doctorService.findById(request.doctorId());
        DoctorSchedule schedule = upsertAppointmentSchedule(appointment, request);

        appointment.setPatient(patient);
        appointment.setDoctor(doctor);
        appointment.setSchedule(schedule);
        // The schema still has bookedAt, but the appointment time now comes from the linked schedule.
        appointment.setBookedAt(schedule.getStartsAt());
        appointment.setStatus(request.status() == null ? AppointmentStatus.MENUNGGU : request.status());
        appointment.setComplaint(request.complaint());
        appointment.setCancelledReason(request.cancelledReason());
    }

    private DoctorSchedule upsertAppointmentSchedule(Appointment appointment, AppointmentRequest request) {
        ScheduleRequest scheduleRequest = new ScheduleRequest(
                request.doctorId(),
                request.startsAt(),
                request.endsAt(),
                request.room(),
                null,
                request.scheduleNotes());

        if (appointment.getSchedule() == null) {
            return scheduleService.createBookedSlot(scheduleRequest);
        }

        return scheduleService.updateBookedSlot(appointment.getSchedule().getId(), scheduleRequest);
    }
}
