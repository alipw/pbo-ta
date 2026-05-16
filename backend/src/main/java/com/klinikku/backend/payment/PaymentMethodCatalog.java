package com.klinikku.backend.payment;

import java.util.List;

public final class PaymentMethodCatalog {

    private static final List<PaymentMethod> METHODS = List.of(
            new CashPaymentMethod(),
            new TransferPaymentMethod(),
            new EWalletPaymentMethod());

    private PaymentMethodCatalog() {
    }

    public static List<PaymentMethod> supportedMethods() {
        return METHODS;
    }
}
