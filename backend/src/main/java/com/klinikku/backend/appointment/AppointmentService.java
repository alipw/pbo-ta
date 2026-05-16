package com.klinikku.backend.appointment;

import com.klinikku.backend.common.ResourceNotFoundException;
import com.klinikku.backend.doctor.DoctorService;
import com.klinikku.backend.patient.PatientService;
import com.klinikku.backend.schedule.DoctorSchedule;
import com.klinikku.backend.schedule.ScheduleService;
import com.klinikku.backend.schedule.ScheduleStatus;
import java.time.OffsetDateTime;
import java.util.List;
import org.springframework.data.domain.Sort;
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
        return appointmentRepository.findAll(Sort.by(Sort.Direction.DESC, "bookedAt")).stream()
                .map(AppointmentResponse::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public Appointment findById(Long appointmentId) {
        return appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Appointment", appointmentId));
    }

    @Transactional
    public AppointmentResponse create(AppointmentRequest request) {
        Appointment appointment = new Appointment();
        appointment.setPatient(patientService.findById(request.patientId()));
        appointment.setDoctor(doctorService.findById(request.doctorId()));
        appointment.setBookedAt(request.bookedAt() == null ? OffsetDateTime.now() : request.bookedAt());
        appointment.setStatus(request.status() == null ? AppointmentStatus.MENUNGGU : request.status());
        appointment.setComplaint(request.complaint());
        appointment.setCancelledReason(request.cancelledReason());

        if (request.scheduleId() != null) {
            DoctorSchedule schedule = scheduleService.findById(request.scheduleId());
            if (!schedule.getDoctor().getId().equals(request.doctorId())) {
                throw new IllegalArgumentException("Schedule doctor does not match appointment doctor");
            }
            schedule.setStatus(ScheduleStatus.BOOKED);
            appointment.setSchedule(schedule);
        }

        return AppointmentResponse.from(appointmentRepository.save(appointment));
    }
}
