package com.klinikku.backend.payment;

public class EWalletPaymentMethod implements PaymentMethod {

    @Override
    public PaymentMethodType type() {
        return PaymentMethodType.EWALLET;
    }

    @Override
    public String displayName() {
        return "E-Wallet";
    }
}
