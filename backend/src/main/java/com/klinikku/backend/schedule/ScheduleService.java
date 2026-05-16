package com.klinikku.backend.schedule;

import com.klinikku.backend.common.ResourceNotFoundException;
import com.klinikku.backend.doctor.DoctorService;
import java.util.List;
import org.springframework.data.domain.Sort;
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
        return scheduleRepository.findAll(Sort.by(Sort.Direction.ASC, "startsAt")).stream()
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
        if (request.endsAt().isBefore(request.startsAt()) || request.endsAt().isEqual(request.startsAt())) {
            throw new IllegalArgumentException("Schedule end must be after start");
        }

        DoctorSchedule schedule = new DoctorSchedule();
        schedule.setDoctor(doctorService.findById(request.doctorId()));
        schedule.setStartsAt(request.startsAt());
        schedule.setEndsAt(request.endsAt());
        schedule.setRoom(request.room());
        schedule.setStatus(request.status() == null ? ScheduleStatus.AVAILABLE : request.status());
        schedule.setNotes(request.notes());

        return ScheduleResponse.from(scheduleRepository.save(schedule));
    }
}
