package com.klinikku.backend.medicalrecord;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface MedicalRecordRepository extends JpaRepository<MedicalRecord, Long> {

    List<MedicalRecord> findByDoctor_IdOrderByCreatedAtDesc(Long doctorId);

    List<MedicalRecord> findByPatient_IdOrderByCreatedAtDesc(Long patientId);

    boolean existsByAppointment_Id(Long appointmentId);
}
