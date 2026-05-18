package com.klinikku.backend.schedule;

import com.klinikku.backend.common.ResourceNotFoundException;
import com.klinikku.backend.doctor.Doctor;
import com.klinikku.backend.doctor.DoctorService;
import java.time.OffsetDateTime;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ScheduleService {

    private final DoctorScheduleRepository scheduleRepository;
    private final DoctorService doctorService;

    public ScheduleService(DoctorScheduleRepository scheduleRepository, DoctorService doctorService) {
        this.scheduleRepository = scheduleRepository;
        this.doctorService = doctorService;
    }

    @Transactional(readOnly = true)
    public List<ScheduleResponse> findAll() {
        return findAll(null, null, null, null);
    }

    @Transactional(readOnly = true)
    public List<ScheduleResponse> findAll(
            Long doctorId,
            ScheduleStatus status,
            OffsetDateTime from,
            OffsetDateTime to) {
        if (from != null && to != null && to.isBefore(from)) {
            throw new IllegalArgumentException("Schedule filter end must be after start");
        }

        return scheduleRepository.findByFilters(doctorId, status, from, to).stream()
                .map(ScheduleResponse::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public DoctorSchedule findById(Long scheduleId) {
        return scheduleRepository.findById(scheduleId)
                .orElseThrow(() -> new ResourceNotFoundException("Schedule", scheduleId));
    }

    @Transactional
    public ScheduleResponse create(ScheduleRequest request) {
        DoctorSchedule schedule = new DoctorSchedule();
        applyRequest(schedule, request);

        return ScheduleResponse.from(scheduleRepository.save(schedule));
    }

    @Transactional
    public ScheduleResponse update(Long scheduleId, ScheduleRequest request) {
        DoctorSchedule schedule = findById(scheduleId);
        applyRequest(schedule, request);

        return ScheduleResponse.from(scheduleRepository.save(schedule));
    }

    @Transactional
    public void deleteById(Long scheduleId) {
        DoctorSchedule schedule = findById(scheduleId);
        if (schedule.getStatus() == ScheduleStatus.BOOKED) {
            throw new IllegalArgumentException("Booked schedule cannot be deleted");
        }

        scheduleRepository.delete(schedule);
    }

    private void applyRequest(DoctorSchedule schedule, ScheduleRequest request) {
        validateRange(request.startsAt(), request.endsAt());

        Doctor doctor = doctorService.findById(request.doctorId());
        ScheduleStatus status = request.status() == null ? ScheduleStatus.AVAILABLE : request.status();

        if (status != ScheduleStatus.CANCELLED
                && scheduleRepository.existsActiveOverlap(
                        doctor.getId(), request.startsAt(), request.endsAt(), schedule.getId())) {
            throw new IllegalArgumentException("Doctor already has an overlapping schedule");
        }

        schedule.setDoctor(doctor);
        schedule.setStartsAt(request.startsAt());
        schedule.setEndsAt(request.endsAt());
        schedule.setRoom(request.room());
        schedule.setStatus(status);
        schedule.setNotes(request.notes());
    }

    private void validateRange(OffsetDateTime startsAt, OffsetDateTime endsAt) {
        if (endsAt.isBefore(startsAt) || endsAt.isEqual(startsAt)) {
            throw new IllegalArgumentException("Schedule end must be after start");
        }
    }
}
