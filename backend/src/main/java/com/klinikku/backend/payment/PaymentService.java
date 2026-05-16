package com.klinikku.backend.payment;

import com.klinikku.backend.appointment.AppointmentService;
import java.time.OffsetDateTime;
import java.util.List;
import org.springframework.data.domain.Sort;
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

    @Transactional
    public PaymentResponse create(PaymentRequest request) {
        Payment payment = new Payment();
        payment.setAppointment(appointmentService.findById(request.appointmentId()));
        payment.setAmount(request.amount());
        payment.setMethodType(request.methodType());
        payment.setStatus(request.status() == null ? PaymentStatus.BELUM_BAYAR : request.status());
        payment.setReferenceNumber(request.referenceNumber());
        payment.setPaidAt(request.paidAt());

        if (payment.getStatus() == PaymentStatus.LUNAS && payment.getPaidAt() == null) {
            payment.setPaidAt(OffsetDateTime.now());
        }

        return PaymentResponse.from(paymentRepository.save(payment));
    }
}
