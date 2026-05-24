package com.klinikku.backend.payment;

import com.klinikku.backend.appointment.Appointment;
import com.klinikku.backend.appointment.AppointmentService;
import com.klinikku.backend.appointment.AppointmentStatus;
import com.klinikku.backend.common.ResourceNotFoundException;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Objects;
import org.springframework.data.domain.Sort;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class PaymentService {

    private final PaymentRepository paymentRepository;
    private final AppointmentService appointmentService;

    public PaymentService(PaymentRepository paymentRepository, AppointmentService appointmentService) {
        this.paymentRepository = paymentRepository;
        this.appointmentService = appointmentService;
    }

    @Transactional(readOnly = true)
    public List<PaymentResponse> findAll() {
        return paymentRepository.findAll(Sort.by(Sort.Direction.DESC, "createdAt")).stream()
                .map(PaymentResponse::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public Payment findById(Long paymentId) {
        return paymentRepository.findById(paymentId)
                .orElseThrow(() -> new ResourceNotFoundException("Payment", paymentId));
    }

    @Transactional(readOnly = true)
    public PaymentResponse findResponseById(Long paymentId) {
        return PaymentResponse.from(findById(paymentId));
    }

    @Transactional(readOnly = true)
    public List<PaymentResponse> findAllForPatient(Long patientId) {
        return paymentRepository.findByAppointment_Patient_IdOrderByCreatedAtDesc(patientId).stream()
                .map(PaymentResponse::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public PaymentResponse findResponseByIdForPatient(Long paymentId, Long patientId) {
        Payment payment = findById(paymentId);
        ensurePatientOwnsPayment(payment, patientId);

        return PaymentResponse.from(payment);
    }

    @Transactional
    public PaymentResponse create(PaymentRequest request) {
        Appointment appointment = appointmentService.findById(request.appointmentId());
        ensureAppointmentCanBeBilled(appointment);

        if (paymentRepository.existsByAppointment_Id(appointment.getId())) {
            throw new IllegalArgumentException("Appointment already has a payment");
        }

        Payment payment = new Payment();
        payment.setAppointment(appointment);
        payment.setAmount(request.amount());
        payment.setMethodType(request.methodType());
        payment.setStatus(PaymentStatus.BELUM_BAYAR);
        payment.setReferenceNumber(request.referenceNumber());

        return PaymentResponse.from(paymentRepository.save(payment));
    }

    @Transactional
    public PaymentResponse updateStatus(Long paymentId, PaymentStatusRequest request) {
        Payment payment = findById(paymentId);

        if (request.methodType() != null) {
            payment.setMethodType(request.methodType());
        }
        if (request.referenceNumber() != null) {
            payment.setReferenceNumber(request.referenceNumber());
        }

        payment.setStatus(request.status());
        if (request.status() == PaymentStatus.LUNAS) {
            payment.setPaidAt(request.paidAt() == null ? OffsetDateTime.now() : request.paidAt());
        } else {
            payment.setPaidAt(null);
        }

        return PaymentResponse.from(paymentRepository.save(payment));
    }

    private void ensureAppointmentCanBeBilled(Appointment appointment) {
        if (appointment.getStatus() != AppointmentStatus.DISETUJUI
                && appointment.getStatus() != AppointmentStatus.SELESAI) {
            throw new IllegalArgumentException("Payments can only be created for approved or completed appointments");
        }
    }

    private void ensurePatientOwnsPayment(Payment payment, Long patientId) {
        if (!Objects.equals(payment.getAppointment().getPatient().getId(), patientId)) {
            throw new AccessDeniedException("Patients can only access their own payments");
        }
    }
}
