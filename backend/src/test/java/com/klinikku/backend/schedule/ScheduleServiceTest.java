package com.klinikku.backend.schedule;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.klinikku.backend.doctor.Doctor;
import com.klinikku.backend.doctor.DoctorService;
import java.time.OffsetDateTime;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

class ScheduleServiceTest {

    private final DoctorScheduleRepository scheduleRepository = org.mockito.Mockito.mock(DoctorScheduleRepository.class);
    private final DoctorService doctorService = org.mockito.Mockito.mock(DoctorService.class);
    private final ScheduleService scheduleService = new ScheduleService(scheduleRepository, doctorService);

    @Test
    void createRejectsOverlappingActiveScheduleBeforeSave() {
        Doctor doctor = doctorWithId(1L);
        ScheduleRequest request = availableRequest();
        when(doctorService.findById(1L)).thenReturn(doctor);
        when(scheduleRepository.existsActiveOverlap(1L, request.startsAt(), request.endsAt(), null))
                .thenReturn(true);

        assertThatThrownBy(() -> scheduleService.create(request))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("Doctor already has an overlapping schedule");

        verify(scheduleRepository, never()).save(any(DoctorSchedule.class));
    }

    @Test
    void createAllowsCancelledScheduleToOverlap() {
        Doctor doctor = doctorWithId(1L);
        ScheduleRequest request = new ScheduleRequest(
                1L,
                OffsetDateTime.parse("2030-01-01T09:00:00+07:00"),
                OffsetDateTime.parse("2030-01-01T10:00:00+07:00"),
                "A101",
                ScheduleStatus.CANCELLED,
                "Doctor unavailable");
        when(doctorService.findById(1L)).thenReturn(doctor);
        when(scheduleRepository.save(any(DoctorSchedule.class))).thenAnswer(invocation -> invocation.getArgument(0));

        scheduleService.create(request);

        verify(scheduleRepository, never()).existsActiveOverlap(any(), any(), any(), any());
        verify(scheduleRepository).save(any(DoctorSchedule.class));
    }

    @Test
    void updateExcludesCurrentScheduleWhenCheckingOverlap() {
        DoctorSchedule schedule = scheduleWithIdAndStatus(10L, ScheduleStatus.AVAILABLE);
        Doctor doctor = doctorWithId(1L);
        ScheduleRequest request = availableRequest();
        when(scheduleRepository.findById(10L)).thenReturn(Optional.of(schedule));
        when(doctorService.findById(1L)).thenReturn(doctor);
        when(scheduleRepository.save(any(DoctorSchedule.class))).thenAnswer(invocation -> invocation.getArgument(0));

        scheduleService.update(10L, request);

        verify(scheduleRepository).existsActiveOverlap(1L, request.startsAt(), request.endsAt(), 10L);
        verify(scheduleRepository).save(schedule);
    }

    @Test
    void deleteRejectsBookedSchedule() {
        DoctorSchedule schedule = scheduleWithIdAndStatus(10L, ScheduleStatus.BOOKED);
        when(scheduleRepository.findById(10L)).thenReturn(Optional.of(schedule));

        assertThatThrownBy(() -> scheduleService.deleteById(10L))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("Booked schedule cannot be deleted");

        verify(scheduleRepository, never()).delete(any(DoctorSchedule.class));
    }

    private ScheduleRequest availableRequest() {
        return new ScheduleRequest(
                1L,
                OffsetDateTime.parse("2030-01-01T09:00:00+07:00"),
                OffsetDateTime.parse("2030-01-01T10:00:00+07:00"),
                "A101",
                ScheduleStatus.AVAILABLE,
                null);
    }

    private Doctor doctorWithId(Long id) {
        Doctor doctor = new Doctor();
        ReflectionTestUtils.setField(doctor, "id", id);
        return doctor;
    }

    private DoctorSchedule scheduleWithIdAndStatus(Long id, ScheduleStatus status) {
        DoctorSchedule schedule = new DoctorSchedule();
        ReflectionTestUtils.setField(schedule, "id", id);
        schedule.setStatus(status);
        return schedule;
    }
}
