package com.klinikku.backend.appointment;

import com.klinikku.backend.schedule.DoctorSchedule;
import jakarta.persistence.criteria.Join;
import jakarta.persistence.criteria.Predicate;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

public interface AppointmentRepository extends JpaRepository<Appointment, Long>, JpaSpecificationExecutor<Appointment> {

    default List<Appointment> findByFilters(
            Long patientId,
            Long doctorId,
            AppointmentStatus status,
            OffsetDateTime from,
            OffsetDateTime to) {
        return findAll((root, query, criteriaBuilder) -> {
            Join<Appointment, DoctorSchedule> schedule = root.join("schedule");
            List<Predicate> predicates = new ArrayList<>();

            if (patientId != null) {
                predicates.add(criteriaBuilder.equal(root.get("patient").get("id"), patientId));
            }
            if (doctorId != null) {
                predicates.add(criteriaBuilder.equal(root.get("doctor").get("id"), doctorId));
            }
            if (status != null) {
                predicates.add(criteriaBuilder.equal(root.get("status"), status));
            }
            if (from != null) {
                predicates.add(criteriaBuilder.greaterThanOrEqualTo(schedule.get("startsAt"), from));
            }
            if (to != null) {
                predicates.add(criteriaBuilder.lessThanOrEqualTo(schedule.get("startsAt"), to));
            }

            query.orderBy(
                    criteriaBuilder.desc(schedule.get("startsAt")),
                    criteriaBuilder.desc(root.get("bookedAt")));

            return criteriaBuilder.and(predicates.toArray(Predicate[]::new));
        });
    }
}
