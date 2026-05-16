package com.klinikku.backend.payment;

public class CashPaymentMethod implements PaymentMethod {

    @Override
    public PaymentMethodType type() {
        return PaymentMethodType.CASH;
    }

    @Override
    public String displayName() {
        return "Cash";
    }
}
