package com.klinikku.backend.medicalrecord;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.klinikku.backend.appointment.Appointment;
import com.klinikku.backend.appointment.AppointmentService;
import com.klinikku.backend.appointment.AppointmentStatus;
import com.klinikku.backend.doctor.Doctor;
import com.klinikku.backend.patient.Patient;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.test.util.ReflectionTestUtils;

class MedicalRecordServiceTest {

    private final MedicalRecordRepository medicalRecordRepository =
            org.mockito.Mockito.mock(MedicalRecordRepository.class);
    private final AppointmentService appointmentService = org.mockito.Mockito.mock(AppointmentService.class);
    private final MedicalRecordService medicalRecordService =
            new MedicalRecordService(medicalRecordRepository, appointmentService);

    @Test
    void createForDoctorCreatesRecordForOwnCompletedAppointment() {
        Doctor doctor = doctorWithId(2L);
        Patient patient = patientWithId(1L);
        Appointment appointment = appointmentWithId(4L, patient, doctor, AppointmentStatus.SELESAI);
        MedicalRecordRequest request =
                new MedicalRecordRequest(4L, "Migraine", "Headache", "Rest and medication");

        when(appointmentService.findById(4L)).thenReturn(appointment);
        when(medicalRecordRepository.existsByAppointment_Id(4L)).thenReturn(false);
        when(medicalRecordRepository.save(any(MedicalRecord.class))).thenAnswer(invocation -> {
            MedicalRecord record = invocation.getArgument(0);
            ReflectionTestUtils.setField(record, "id", 9L);
            return record;
        });

        MedicalRecordResponse response = medicalRecordService.createForDoctor(2L, request);

        assertThat(response.id()).isEqualTo(9L);
        assertThat(response.appointmentId()).isEqualTo(4L);
        assertThat(response.patientId()).isEqualTo(1L);
        assertThat(response.doctorId()).isEqualTo(2L);
        assertThat(response.diagnosis()).isEqualTo("Migraine");
        assertThat(response.symptoms()).isEqualTo("Headache");
        assertThat(response.treatmentNotes()).isEqualTo("Rest and medication");
        verify(medicalRecordRepository).save(any(MedicalRecord.class));
    }

    @Test
    void createForDoctorRejectsAnotherDoctorsAppointment() {
        Appointment appointment =
                appointmentWithId(4L, patientWithId(1L), doctorWithId(2L), AppointmentStatus.SELESAI);
        MedicalRecordRequest request = new MedicalRecordRequest(4L, "Diagnosis", null, null);

        when(appointmentService.findById(4L)).thenReturn(appointment);

        assertThatThrownBy(() -> medicalRecordService.createForDoctor(9L, request))
                .isInstanceOf(AccessDeniedException.class)
                .hasMessage("Doctors can only create records for their own appointments");

        verify(medicalRecordRepository, never()).existsByAppointment_Id(any());
        verify(medicalRecordRepository, never()).save(any(MedicalRecord.class));
    }

    @Test
    void createForDoctorRejectsIncompleteAppointment() {
        Appointment appointment =
                appointmentWithId(4L, patientWithId(1L), doctorWithId(2L), AppointmentStatus.DISETUJUI);
        MedicalRecordRequest request = new MedicalRecordRequest(4L, "Diagnosis", null, null);

        when(appointmentService.findById(4L)).thenReturn(appointment);

        assertThatThrownBy(() -> medicalRecordService.createForDoctor(2L, request))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("Medical records can only be created for completed appointments");

        verify(medicalRecordRepository, never()).save(any(MedicalRecord.class));
    }

    @Test
    void createForDoctorRejectsDuplicateRecordForAppointment() {
        Appointment appointment =
                appointmentWithId(4L, patientWithId(1L), doctorWithId(2L), AppointmentStatus.SELESAI);
        MedicalRecordRequest request = new MedicalRecordRequest(4L, "Diagnosis", null, null);

        when(appointmentService.findById(4L)).thenReturn(appointment);
        when(medicalRecordRepository.existsByAppointment_Id(4L)).thenReturn(true);

        assertThatThrownBy(() -> medicalRecordService.createForDoctor(2L, request))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("Appointment already has a medical record");

        verify(medicalRecordRepository, never()).save(any(MedicalRecord.class));
    }

    @Test
    void findResponseByIdForDoctorRejectsRecordOwnedByAnotherDoctor() {
        MedicalRecord record = recordWithId(
                7L,
                appointmentWithId(4L, patientWithId(1L), doctorWithId(2L), AppointmentStatus.SELESAI));

        when(medicalRecordRepository.findById(7L)).thenReturn(Optional.of(record));

        assertThatThrownBy(() -> medicalRecordService.findResponseByIdForDoctor(7L, 9L))
                .isInstanceOf(AccessDeniedException.class)
                .hasMessage("Doctors can only access their own medical records");
    }

    @Test
    void findResponseByIdForPatientRejectsRecordOwnedByAnotherPatient() {
        MedicalRecord record = recordWithId(
                7L,
                appointmentWithId(4L, patientWithId(1L), doctorWithId(2L), AppointmentStatus.SELESAI));

        when(medicalRecordRepository.findById(7L)).thenReturn(Optional.of(record));

        assertThatThrownBy(() -> medicalRecordService.findResponseByIdForPatient(7L, 8L))
                .isInstanceOf(AccessDeniedException.class)
                .hasMessage("Patients can only access their own medical records");
    }

    @Test
    void findAllForDoctorUsesDoctorScopedRepositoryQuery() {
        MedicalRecord record = recordWithId(
                7L,
                appointmentWithId(4L, patientWithId(1L), doctorWithId(2L), AppointmentStatus.SELESAI));
        when(medicalRecordRepository.findByDoctor_IdOrderByCreatedAtDesc(2L)).thenReturn(List.of(record));

        List<MedicalRecordResponse> responses = medicalRecordService.findAllForDoctor(2L);

        assertThat(responses).hasSize(1);
        assertThat(responses.getFirst().doctorId()).isEqualTo(2L);
    }

    @Test
    void findAllForPatientUsesPatientScopedRepositoryQuery() {
        MedicalRecord record = recordWithId(
                7L,
                appointmentWithId(4L, patientWithId(1L), doctorWithId(2L), AppointmentStatus.SELESAI));
        when(medicalRecordRepository.findByPatient_IdOrderByCreatedAtDesc(1L)).thenReturn(List.of(record));

        List<MedicalRecordResponse> responses = medicalRecordService.findAllForPatient(1L);

        assertThat(responses).hasSize(1);
        assertThat(responses.getFirst().patientId()).isEqualTo(1L);
    }

    private MedicalRecord recordWithId(Long id, Appointment appointment) {
        MedicalRecord record = new MedicalRecord();
        ReflectionTestUtils.setField(record, "id", id);
        record.setAppointment(appointment);
        record.setPatient(appointment.getPatient());
        record.setDoctor(appointment.getDoctor());
        record.setSymptoms("Headache");
        record.setDiagnosis("Migraine");
        record.setTreatmentNotes("Rest and medication");
        return record;
    }

    private Appointment appointmentWithId(
            Long id,
            Patient patient,
            Doctor doctor,
            AppointmentStatus status) {
        Appointment appointment = new Appointment();
        ReflectionTestUtils.setField(appointment, "id", id);
        appointment.setPatient(patient);
        appointment.setDoctor(doctor);
        appointment.setStatus(status);
        appointment.setBookedAt(OffsetDateTime.parse("2026-06-01T09:00:00+07:00"));
        return appointment;
    }

    private Patient patientWithId(Long id) {
        Patient patient = new Patient();
        ReflectionTestUtils.setField(patient, "id", id);
        patient.setFullName("Patient Test");
        return patient;
    }

    private Doctor doctorWithId(Long id) {
        Doctor doctor = new Doctor();
        ReflectionTestUtils.setField(doctor, "id", id);
        doctor.setFullName("Doctor Test");
        return doctor;
    }
}
