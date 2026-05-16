package com.klinikku.backend.payment;

public class TransferPaymentMethod implements PaymentMethod {

    @Override
    public PaymentMethodType type() {
        return PaymentMethodType.TRANSFER;
    }

    @Override
    public String displayName() {
        return "Bank Transfer";
    }
}
