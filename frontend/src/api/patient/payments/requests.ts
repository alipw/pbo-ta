import { apiRequest } from "@/api/client";

import type { PaymentResponse } from "./types";

const PATIENT_PAYMENTS_PATH = "/api/v1/patient/payments";

export function listPayments() {
	return apiRequest<PaymentResponse[]>(PATIENT_PAYMENTS_PATH);
}

export function getPayment(paymentId: number) {
	return apiRequest<PaymentResponse>(`${PATIENT_PAYMENTS_PATH}/${paymentId}`);
}
