package com.klinikku.backend.medicalrecord;

import com.klinikku.backend.appointment.Appointment;
import com.klinikku.backend.appointment.AppointmentService;
import java.util.List;
import org.springframework.data.domain.Sort;
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

    @Transactional
    public MedicalRecordResponse create(MedicalRecordRequest request) {
        Appointment appointment = appointmentService.findById(request.appointmentId());

        MedicalRecord record = new MedicalRecord();
        record.setAppointment(appointment);
        record.setPatient(appointment.getPatient());
        record.setDoctor(appointment.getDoctor());
        record.setSymptoms(request.symptoms());
        record.setDiagnosis(request.diagnosis());
        record.setTreatmentNotes(request.treatmentNotes());

        return MedicalRecordResponse.from(medicalRecordRepository.save(record));
    }
}
