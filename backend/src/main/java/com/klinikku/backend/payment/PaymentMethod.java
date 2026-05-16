package com.klinikku.backend.payment;

public interface PaymentMethod {

    PaymentMethodType type();

    String displayName();
}
