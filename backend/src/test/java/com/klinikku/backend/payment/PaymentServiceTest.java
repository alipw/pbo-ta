package com.klinikku.backend.payment;

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
import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.test.util.ReflectionTestUtils;

class PaymentServiceTest {

    private final PaymentRepository paymentRepository = org.mockito.Mockito.mock(PaymentRepository.class);
    private final AppointmentService appointmentService = org.mockito.Mockito.mock(AppointmentService.class);
    private final PaymentService paymentService = new PaymentService(paymentRepository, appointmentService);

    @Test
    void createCreatesUnpaidPaymentForApprovedAppointment() {
        Appointment appointment =
                appointmentWithId(4L, patientWithId(1L), doctorWithId(2L), AppointmentStatus.DISETUJUI);
        PaymentRequest request = new PaymentRequest(4L, new BigDecimal("150000.00"), PaymentMethodType.TRANSFER, "INV-1");

        when(appointmentService.findById(4L)).thenReturn(appointment);
        when(paymentRepository.existsByAppointment_Id(4L)).thenReturn(false);
        when(paymentRepository.save(any(Payment.class))).thenAnswer(invocation -> {
            Payment payment = invocation.getArgument(0);
            ReflectionTestUtils.setField(payment, "id", 9L);
            return payment;
        });

        PaymentResponse response = paymentService.create(request);

        assertThat(response.id()).isEqualTo(9L);
        assertThat(response.appointmentId()).isEqualTo(4L);
        assertThat(response.appointmentDate()).isEqualTo(OffsetDateTime.parse("2026-06-01T09:00:00+07:00"));
        assertThat(response.patientId()).isEqualTo(1L);
        assertThat(response.doctorId()).isEqualTo(2L);
        assertThat(response.amount()).isEqualByComparingTo("150000.00");
        assertThat(response.status()).isEqualTo(PaymentStatus.BELUM_BAYAR);
        assertThat(response.methodType()).isEqualTo(PaymentMethodType.TRANSFER);
        assertThat(response.methodDisplayName()).isEqualTo("Bank Transfer");
        assertThat(response.referenceNumber()).isEqualTo("INV-1");
        assertThat(response.paidAt()).isNull();
        verify(paymentRepository).save(any(Payment.class));
    }

    @Test
    void createAllowsCompletedAppointment() {
        Appointment appointment =
                appointmentWithId(4L, patientWithId(1L), doctorWithId(2L), AppointmentStatus.SELESAI);
        PaymentRequest request = new PaymentRequest(4L, new BigDecimal("150000.00"), PaymentMethodType.CASH, null);

        when(appointmentService.findById(4L)).thenReturn(appointment);
        when(paymentRepository.existsByAppointment_Id(4L)).thenReturn(false);
        when(paymentRepository.save(any(Payment.class))).thenAnswer(invocation -> invocation.getArgument(0));

        PaymentResponse response = paymentService.create(request);

        assertThat(response.status()).isEqualTo(PaymentStatus.BELUM_BAYAR);
        assertThat(response.methodType()).isEqualTo(PaymentMethodType.CASH);
    }

    @Test
    void createRejectsWaitingAppointment() {
        Appointment appointment =
                appointmentWithId(4L, patientWithId(1L), doctorWithId(2L), AppointmentStatus.MENUNGGU);
        PaymentRequest request = new PaymentRequest(4L, new BigDecimal("150000.00"), PaymentMethodType.CASH, null);

        when(appointmentService.findById(4L)).thenReturn(appointment);

        assertThatThrownBy(() -> paymentService.create(request))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("Payments can only be created for approved or completed appointments");

        verify(paymentRepository, never()).existsByAppointment_Id(any());
        verify(paymentRepository, never()).save(any(Payment.class));
    }

    @Test
    void createRejectsCancelledAppointment() {
        Appointment appointment =
                appointmentWithId(4L, patientWithId(1L), doctorWithId(2L), AppointmentStatus.DIBATALKAN);
        PaymentRequest request = new PaymentRequest(4L, new BigDecimal("150000.00"), PaymentMethodType.CASH, null);

        when(appointmentService.findById(4L)).thenReturn(appointment);

        assertThatThrownBy(() -> paymentService.create(request))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("Payments can only be created for approved or completed appointments");

        verify(paymentRepository, never()).existsByAppointment_Id(any());
        verify(paymentRepository, never()).save(any(Payment.class));
    }

    @Test
    void createRejectsDuplicateAppointmentPayment() {
        Appointment appointment =
                appointmentWithId(4L, patientWithId(1L), doctorWithId(2L), AppointmentStatus.DISETUJUI);
        PaymentRequest request = new PaymentRequest(4L, new BigDecimal("150000.00"), PaymentMethodType.CASH, null);

        when(appointmentService.findById(4L)).thenReturn(appointment);
        when(paymentRepository.existsByAppointment_Id(4L)).thenReturn(true);

        assertThatThrownBy(() -> paymentService.create(request))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("Appointment already has a payment");

        verify(paymentRepository, never()).save(any(Payment.class));
    }

    @Test
    void updateStatusToPaidSetsPaidAtWhenMissing() {
        Payment payment = paymentWithId(
                7L,
                appointmentWithId(4L, patientWithId(1L), doctorWithId(2L), AppointmentStatus.DISETUJUI),
                PaymentStatus.BELUM_BAYAR);
        PaymentStatusRequest request = new PaymentStatusRequest(PaymentStatus.LUNAS, PaymentMethodType.EWALLET, "PAY-1", null);

        when(paymentRepository.findById(7L)).thenReturn(Optional.of(payment));
        when(paymentRepository.save(any(Payment.class))).thenAnswer(invocation -> invocation.getArgument(0));

        PaymentResponse response = paymentService.updateStatus(7L, request);

        assertThat(response.status()).isEqualTo(PaymentStatus.LUNAS);
        assertThat(response.methodType()).isEqualTo(PaymentMethodType.EWALLET);
        assertThat(response.referenceNumber()).isEqualTo("PAY-1");
        assertThat(response.paidAt()).isNotNull();
    }

    @Test
    void updateStatusToUnpaidClearsPaidAt() {
        Payment payment = paymentWithId(
                7L,
                appointmentWithId(4L, patientWithId(1L), doctorWithId(2L), AppointmentStatus.DISETUJUI),
                PaymentStatus.LUNAS);
        payment.setPaidAt(OffsetDateTime.parse("2026-06-02T10:00:00+07:00"));
        PaymentStatusRequest request = new PaymentStatusRequest(PaymentStatus.BELUM_BAYAR, null, null, null);

        when(paymentRepository.findById(7L)).thenReturn(Optional.of(payment));
        when(paymentRepository.save(any(Payment.class))).thenAnswer(invocation -> invocation.getArgument(0));

        PaymentResponse response = paymentService.updateStatus(7L, request);

        assertThat(response.status()).isEqualTo(PaymentStatus.BELUM_BAYAR);
        assertThat(response.paidAt()).isNull();
    }

    @Test
    void findAllForPatientUsesPatientScopedRepositoryQuery() {
        Payment payment = paymentWithId(
                7L,
                appointmentWithId(4L, patientWithId(1L), doctorWithId(2L), AppointmentStatus.DISETUJUI),
                PaymentStatus.BELUM_BAYAR);
        when(paymentRepository.findByAppointment_Patient_IdOrderByCreatedAtDesc(1L)).thenReturn(List.of(payment));

        List<PaymentResponse> responses = paymentService.findAllForPatient(1L);

        assertThat(responses).hasSize(1);
        assertThat(responses.getFirst().patientId()).isEqualTo(1L);
    }

    @Test
    void findResponseByIdForPatientRejectsAnotherPatientsPayment() {
        Payment payment = paymentWithId(
                7L,
                appointmentWithId(4L, patientWithId(1L), doctorWithId(2L), AppointmentStatus.DISETUJUI),
                PaymentStatus.BELUM_BAYAR);
        when(paymentRepository.findById(7L)).thenReturn(Optional.of(payment));

        assertThatThrownBy(() -> paymentService.findResponseByIdForPatient(7L, 8L))
                .isInstanceOf(AccessDeniedException.class)
                .hasMessage("Patients can only access their own payments");
    }

    private Payment paymentWithId(Long id, Appointment appointment, PaymentStatus status) {
        Payment payment = new Payment();
        ReflectionTestUtils.setField(payment, "id", id);
        payment.setAppointment(appointment);
        payment.setAmount(new BigDecimal("150000.00"));
        payment.setStatus(status);
        payment.setMethodType(PaymentMethodType.CASH);
        return payment;
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
