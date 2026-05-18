package com.klinikku.backend.schedule;

import java.time.OffsetDateTime;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface DoctorScheduleRepository extends JpaRepository<DoctorSchedule, Long> {

    @Query("""
            select schedule
            from DoctorSchedule schedule
            where (:doctorId is null or schedule.doctor.id = :doctorId)
              and (:status is null or schedule.status = :status)
              and (:from is null or schedule.startsAt >= :from)
              and (:to is null or schedule.startsAt <= :to)
            order by schedule.startsAt asc
            """)
    List<DoctorSchedule> findByFilters(
            @Param("doctorId") Long doctorId,
            @Param("status") ScheduleStatus status,
            @Param("from") OffsetDateTime from,
            @Param("to") OffsetDateTime to);

    @Query("""
            select count(schedule) > 0
            from DoctorSchedule schedule
            where schedule.doctor.id = :doctorId
              and schedule.status <> com.klinikku.backend.schedule.ScheduleStatus.CANCELLED
              and (:excludedScheduleId is null or schedule.id <> :excludedScheduleId)
              and schedule.startsAt < :endsAt
              and schedule.endsAt > :startsAt
            """)
    boolean existsActiveOverlap(
            @Param("doctorId") Long doctorId,
            @Param("startsAt") OffsetDateTime startsAt,
            @Param("endsAt") OffsetDateTime endsAt,
            @Param("excludedScheduleId") Long excludedScheduleId);
}
