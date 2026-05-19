package com.klinikku.backend.schedule;

import jakarta.persistence.criteria.Predicate;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface DoctorScheduleRepository
        extends JpaRepository<DoctorSchedule, Long>, JpaSpecificationExecutor<DoctorSchedule> {

    default List<DoctorSchedule> findByFilters(
            Long doctorId,
            ScheduleStatus status,
            OffsetDateTime from,
            OffsetDateTime to) {
        return findAll((root, query, criteriaBuilder) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (doctorId != null) {
                predicates.add(criteriaBuilder.equal(root.get("doctor").get("id"), doctorId));
            }
            if (status != null) {
                predicates.add(criteriaBuilder.equal(root.get("status"), status));
            }
            if (from != null) {
                predicates.add(criteriaBuilder.greaterThanOrEqualTo(root.get("startsAt"), from));
            }
            if (to != null) {
                predicates.add(criteriaBuilder.lessThanOrEqualTo(root.get("startsAt"), to));
            }

            query.orderBy(criteriaBuilder.asc(root.get("startsAt")));

            return criteriaBuilder.and(predicates.toArray(Predicate[]::new));
        });
    }

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
