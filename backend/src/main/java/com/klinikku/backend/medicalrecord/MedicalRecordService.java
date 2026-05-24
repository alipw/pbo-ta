package com.klinikku.backend.medicalrecord;

import com.klinikku.backend.appointment.Appointment;
import com.klinikku.backend.appointment.AppointmentStatus;
import com.klinikku.backend.appointment.AppointmentService;
import com.klinikku.backend.common.ResourceNotFoundException;
import java.util.List;
import java.util.Objects;
import org.springframework.data.domain.Sort;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class MedicalRecordService {

    private final MedicalRecordRepository medicalRecordRepository;
    private final AppointmentService appointmentService;

    public MedicalRecordService(
            MedicalRecordRepository medicalRecordRepository, AppointmentService appointmentService) {
        this.medicalRecordRepository = medicalRecordRepository;
        this.appointmentService = appointmentService;
    }

    @Transactional(readOnly = true)
    public List<MedicalRecordResponse> findAll() {
        return medicalRecordRepository.findAll(Sort.by(Sort.Direction.DESC, "createdAt")).stream()
                .map(MedicalRecordResponse::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public MedicalRecordResponse findResponseById(Long recordId) {
        return MedicalRecordResponse.from(findById(recordId));
    }

    @Transactional(readOnly = true)
    public List<MedicalRecordResponse> findAllForDoctor(Long doctorId) {
        return medicalRecordRepository.findByDoctor_IdOrderByCreatedAtDesc(doctorId).stream()
                .map(MedicalRecordResponse::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public MedicalRecordResponse findResponseByIdForDoctor(Long recordId, Long doctorId) {
        MedicalRecord record = findById(recordId);
        ensureDoctorOwnsRecord(record, doctorId);

        return MedicalRecordResponse.from(record);
    }

    @Transactional(readOnly = true)
    public List<MedicalRecordResponse> findAllForPatient(Long patientId) {
        return medicalRecordRepository.findByPatient_IdOrderByCreatedAtDesc(patientId).stream()
                .map(MedicalRecordResponse::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public MedicalRecordResponse findResponseByIdForPatient(Long recordId, Long patientId) {
        MedicalRecord record = findById(recordId);
        ensurePatientOwnsRecord(record, patientId);

        return MedicalRecordResponse.from(record);
    }

    @Transactional
    public MedicalRecordResponse createForDoctor(Long doctorId, MedicalRecordRequest request) {
        Appointment appointment = appointmentService.findById(request.appointmentId());
        ensureDoctorOwnsAppointment(appointment, doctorId);
        ensureAppointmentIsCompleted(appointment);
        ensureAppointmentDoesNotHaveMedicalRecord(appointment.getId());

        MedicalRecord record = new MedicalRecord();
        record.setAppointment(appointment);
        record.setPatient(appointment.getPatient());
        record.setDoctor(appointment.getDoctor());
        record.setSymptoms(request.symptoms());
        record.setDiagnosis(request.diagnosis());
        record.setTreatmentNotes(request.treatmentNotes());

        return MedicalRecordResponse.from(medicalRecordRepository.save(record));
    }

    private MedicalRecord findById(Long recordId) {
        return medicalRecordRepository.findById(recordId)
                .orElseThrow(() -> new ResourceNotFoundException("Medical record", recordId));
    }

    private void ensureDoctorOwnsAppointment(Appointment appointment, Long doctorId) {
        if (!Objects.equals(appointment.getDoctor().getId(), doctorId)) {
            throw new AccessDeniedException("Doctors can only create records for their own appointments");
        }
    }

    private void ensureAppointmentIsCompleted(Appointment appointment) {
        if (appointment.getStatus() != AppointmentStatus.SELESAI) {
            throw new IllegalArgumentException("Medical records can only be created for completed appointments");
        }
    }

    private void ensureAppointmentDoesNotHaveMedicalRecord(Long appointmentId) {
        if (medicalRecordRepository.existsByAppointment_Id(appointmentId)) {
            throw new IllegalArgumentException("Appointment already has a medical record");
        }
    }

    private void ensureDoctorOwnsRecord(MedicalRecord record, Long doctorId) {
        if (!Objects.equals(record.getDoctor().getId(), doctorId)) {
            throw new AccessDeniedException("Doctors can only access their own medical records");
        }
    }

    private void ensurePatientOwnsRecord(MedicalRecord record, Long patientId) {
        if (!Objects.equals(record.getPatient().getId(), patientId)) {
            throw new AccessDeniedException("Patients can only access their own medical records");
        }
    }
}
