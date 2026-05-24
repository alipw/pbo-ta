package com.klinikku.backend.web.patient.payment;

import com.klinikku.backend.auth.AuthenticatedUser;
import com.klinikku.backend.payment.PaymentResponse;
import com.klinikku.backend.payment.PaymentService;
import java.util.List;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/patient/payments")
public class PatientPaymentController {

    private final PaymentService paymentService;

    public PatientPaymentController(PaymentService paymentService) {
        this.paymentService = paymentService;
    }

    @GetMapping
    public List<PaymentResponse> listPayments(@AuthenticationPrincipal AuthenticatedUser user) {
        return paymentService.findAllForPatient(user.id());
    }

    @GetMapping("/{paymentId}")
    public PaymentResponse getPayment(
            @AuthenticationPrincipal AuthenticatedUser user,
            @PathVariable Long paymentId) {
        return paymentService.findResponseByIdForPatient(paymentId, user.id());
    }
}
