import { apiRequest } from "@/api/client";

import type {
	PaymentRequest,
	PaymentResponse,
	PaymentStatusRequest,
} from "./types";

const ADMIN_PAYMENTS_PATH = "/api/v1/admin/payments";

export function listPayments() {
	return apiRequest<PaymentResponse[]>(ADMIN_PAYMENTS_PATH);
}

export function getPayment(paymentId: number) {
	return apiRequest<PaymentResponse>(`${ADMIN_PAYMENTS_PATH}/${paymentId}`);
}

export function createPayment(request: PaymentRequest) {
	return apiRequest<PaymentResponse, PaymentRequest>(ADMIN_PAYMENTS_PATH, {
		method: "POST",
		body: request,
	});
}

export function updatePaymentStatus(
	paymentId: number,
	request: PaymentStatusRequest,
) {
	return apiRequest<PaymentResponse, PaymentStatusRequest>(
		`${ADMIN_PAYMENTS_PATH}/${paymentId}/status`,
		{
			method: "PATCH",
			body: request,
		},
	);
}
