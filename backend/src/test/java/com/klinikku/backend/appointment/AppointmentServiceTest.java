package com.klinikku.backend.appointment;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.klinikku.backend.doctor.Doctor;
import com.klinikku.backend.doctor.DoctorService;
import com.klinikku.backend.patient.Patient;
import com.klinikku.backend.patient.PatientService;
import com.klinikku.backend.schedule.DoctorSchedule;
import com.klinikku.backend.schedule.ScheduleRequest;
import com.klinikku.backend.schedule.ScheduleService;
import com.klinikku.backend.schedule.ScheduleStatus;
import java.time.OffsetDateTime;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.test.util.ReflectionTestUtils;

class AppointmentServiceTest {

    private final AppointmentRepository appointmentRepository = org.mockito.Mockito.mock(AppointmentRepository.class);
    private final PatientService patientService = org.mockito.Mockito.mock(PatientService.class);
    private final DoctorService doctorService = org.mockito.Mockito.mock(DoctorService.class);
    private final ScheduleService scheduleService = org.mockito.Mockito.mock(ScheduleService.class);
    private final AppointmentService appointmentService =
            new AppointmentService(appointmentRepository, patientService, doctorService, scheduleService);

    @Test
    void createCreatesBookedScheduleAndDerivesBookedAtFromScheduleStart() {
        OffsetDateTime startsAt = OffsetDateTime.parse("2026-06-01T09:00:00+07:00");
        OffsetDateTime endsAt = OffsetDateTime.parse("2026-06-01T09:30:00+07:00");
        AppointmentRequest request = request(startsAt, endsAt);
        Patient patient = patientWithId(1L);
        Doctor doctor = doctorWithId(2L);
        DoctorSchedule schedule = scheduleWithId(3L, doctor, startsAt, endsAt);

        when(patientService.findById(1L)).thenReturn(patient);
        when(doctorService.findById(2L)).thenReturn(doctor);
        when(scheduleService.createBookedSlot(any(ScheduleRequest.class))).thenReturn(schedule);
        when(appointmentRepository.save(any(Appointment.class))).thenAnswer(invocation -> invocation.getArgument(0));

        AppointmentResponse response = appointmentService.create(request);

        assertThat(response.bookedAt()).isEqualTo(startsAt);
        assertThat(response.startsAt()).isEqualTo(startsAt);
        assertThat(response.endsAt()).isEqualTo(endsAt);
        assertThat(response.scheduleId()).isEqualTo(3L);
        verify(scheduleService).createBookedSlot(new ScheduleRequest(
                2L, startsAt, endsAt, "A101", null, "Bring previous lab result"));
    }

    @Test
    void updateReusesExistingScheduleSlot() {
        OffsetDateTime startsAt = OffsetDateTime.parse("2026-06-02T10:00:00+07:00");
        OffsetDateTime endsAt = OffsetDateTime.parse("2026-06-02T10:30:00+07:00");
        Doctor doctor = doctorWithId(2L);
        Appointment appointment = appointmentWithId(4L, scheduleWithId(3L, doctor, startsAt, endsAt));
        DoctorSchedule updatedSchedule = scheduleWithId(3L, doctor, startsAt, endsAt);

        when(appointmentRepository.findById(4L)).thenReturn(Optional.of(appointment));
        when(patientService.findById(1L)).thenReturn(patientWithId(1L));
        when(doctorService.findById(2L)).thenReturn(doctor);
        when(scheduleService.updateBookedSlot(any(), any(ScheduleRequest.class))).thenReturn(updatedSchedule);
        when(appointmentRepository.save(any(Appointment.class))).thenAnswer(invocation -> invocation.getArgument(0));

        appointmentService.update(4L, request(startsAt, endsAt));

        verify(scheduleService).updateBookedSlot(3L, new ScheduleRequest(
                2L, startsAt, endsAt, "A101", null, "Bring previous lab result"));
        verify(appointmentRepository).save(appointment);
    }

    @Test
    void deleteRemovesAppointmentOwnedScheduleSlot() {
        Doctor doctor = doctorWithId(2L);
        DoctorSchedule schedule = scheduleWithId(
                3L,
                doctor,
                OffsetDateTime.parse("2026-06-03T11:00:00+07:00"),
                OffsetDateTime.parse("2026-06-03T11:30:00+07:00"));
        Appointment appointment = appointmentWithId(4L, schedule);
        when(appointmentRepository.findById(4L)).thenReturn(Optional.of(appointment));

        appointmentService.deleteById(4L);

        verify(appointmentRepository).delete(appointment);
        verify(scheduleService).deleteBookedSlot(schedule);
    }

    @Test
    void updateStatusChangesAppointmentWithoutTouchingSchedule() {
        Doctor doctor = doctorWithId(2L);
        DoctorSchedule schedule = scheduleWithId(
                3L,
                doctor,
                OffsetDateTime.parse("2026-06-03T11:00:00+07:00"),
                OffsetDateTime.parse("2026-06-03T11:30:00+07:00"));
        Appointment appointment = appointmentWithId(4L, schedule);
        appointment.setPatient(patientWithId(1L));
        appointment.setDoctor(doctor);
        appointment.setBookedAt(schedule.getStartsAt());
        appointment.setStatus(AppointmentStatus.MENUNGGU);
        when(appointmentRepository.findById(4L)).thenReturn(Optional.of(appointment));
        when(appointmentRepository.save(any(Appointment.class))).thenAnswer(invocation -> invocation.getArgument(0));

        AppointmentResponse response =
                appointmentService.updateStatus(4L, AppointmentStatus.DIBATALKAN, "Patient requested cancellation");

        assertThat(response.status()).isEqualTo(AppointmentStatus.DIBATALKAN);
        assertThat(response.cancelledReason()).isEqualTo("Patient requested cancellation");
        verify(appointmentRepository).save(appointment);
    }

    @Test
    void createForDoctorRejectsDifferentDoctorIdInRequest() {
        OffsetDateTime startsAt = OffsetDateTime.parse("2026-06-04T09:00:00+07:00");

        assertThatThrownBy(() -> appointmentService.createForDoctor(request(startsAt, startsAt.plusMinutes(30)), 9L))
                .isInstanceOf(AccessDeniedException.class)
                .hasMessage("Doctors can only manage appointments assigned to themselves");

        verify(appointmentRepository, never()).save(any(Appointment.class));
    }

    @Test
    void updateForDoctorRejectsAppointmentOwnedByAnotherDoctor() {
        OffsetDateTime startsAt = OffsetDateTime.parse("2026-06-05T09:00:00+07:00");
        Doctor owner = doctorWithId(2L);
        Appointment appointment = appointmentWithId(4L, scheduleWithId(3L, owner, startsAt, startsAt.plusMinutes(30)));
        appointment.setDoctor(owner);
        when(appointmentRepository.findById(4L)).thenReturn(Optional.of(appointment));

        assertThatThrownBy(() -> appointmentService.updateForDoctor(4L, request(startsAt, startsAt.plusMinutes(30)), 9L))
                .isInstanceOf(AccessDeniedException.class)
                .hasMessage("Doctors can only access their own appointments");

        verify(appointmentRepository, never()).save(any(Appointment.class));
    }

    @Test
    void updateForDoctorRejectsReassigningOwnAppointmentToAnotherDoctor() {
        OffsetDateTime startsAt = OffsetDateTime.parse("2026-06-06T09:00:00+07:00");
        Doctor owner = doctorWithId(2L);
        Appointment appointment = appointmentWithId(4L, scheduleWithId(3L, owner, startsAt, startsAt.plusMinutes(30)));
        appointment.setDoctor(owner);
        AppointmentRequest reassignmentRequest = new AppointmentRequest(
                1L,
                9L,
                startsAt,
                startsAt.plusMinutes(30),
                "A101",
                "Bring previous lab result",
                null,
                "Headache",
                null);
        when(appointmentRepository.findById(4L)).thenReturn(Optional.of(appointment));

        assertThatThrownBy(() -> appointmentService.updateForDoctor(4L, reassignmentRequest, 2L))
                .isInstanceOf(AccessDeniedException.class)
                .hasMessage("Doctors can only manage appointments assigned to themselves");

        verify(appointmentRepository, never()).save(any(Appointment.class));
    }

    private AppointmentRequest request(OffsetDateTime startsAt, OffsetDateTime endsAt) {
        return new AppointmentRequest(
                1L,
                2L,
                startsAt,
                endsAt,
                "A101",
                "Bring previous lab result",
                null,
                "Headache",
                null);
    }

    private Appointment appointmentWithId(Long id, DoctorSchedule schedule) {
        Appointment appointment = new Appointment();
        ReflectionTestUtils.setField(appointment, "id", id);
        appointment.setSchedule(schedule);
        return appointment;
    }

    private DoctorSchedule scheduleWithId(Long id, Doctor doctor, OffsetDateTime startsAt, OffsetDateTime endsAt) {
        DoctorSchedule schedule = new DoctorSchedule();
        ReflectionTestUtils.setField(schedule, "id", id);
        schedule.setDoctor(doctor);
        schedule.setStartsAt(startsAt);
        schedule.setEndsAt(endsAt);
        schedule.setRoom("A101");
        schedule.setStatus(ScheduleStatus.BOOKED);
        schedule.setNotes("Bring previous lab result");
        return schedule;
    }

    private Patient patientWithId(Long id) {
        Patient patient = new Patient();
        ReflectionTestUtils.setField(patient, "id", id);
        patient.setFullName("Patient Test");
        return patient;
    }

    private Doctor doctorWithId(Long id) {
        Doctor doctor = new Doctor();
        ReflectionTestUtils.setField(doctor, "id", id);
        doctor.setFullName("Doctor Test");
        return doctor;
    }
}
