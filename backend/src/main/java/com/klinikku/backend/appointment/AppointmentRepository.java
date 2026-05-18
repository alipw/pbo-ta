package com.klinikku.backend.appointment;

import java.time.OffsetDateTime;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface AppointmentRepository extends JpaRepository<Appointment, Long> {

    @Query("""
            select appointment
            from Appointment appointment
            where (:patientId is null or appointment.patient.id = :patientId)
              and (:doctorId is null or appointment.doctor.id = :doctorId)
              and (:status is null or appointment.status = :status)
              and (:from is null or appointment.schedule.startsAt >= :from)
              and (:to is null or appointment.schedule.startsAt <= :to)
            order by appointment.schedule.startsAt desc, appointment.bookedAt desc
            """)
    List<Appointment> findByFilters(
            @Param("patientId") Long patientId,
            @Param("doctorId") Long doctorId,
            @Param("status") AppointmentStatus status,
            @Param("from") OffsetDateTime from,
            @Param("to") OffsetDateTime to);
}
