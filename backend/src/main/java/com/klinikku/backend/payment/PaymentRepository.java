package com.klinikku.backend.payment;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PaymentRepository extends JpaRepository<Payment, Long> {

    boolean existsByAppointment_Id(Long appointmentId);

    List<Payment> findByAppointment_Patient_IdOrderByCreatedAtDesc(Long patientId);
}
