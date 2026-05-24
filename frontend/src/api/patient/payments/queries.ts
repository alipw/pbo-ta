import { queryOptions } from "@tanstack/react-query";

import { getPayment, listPayments } from "./requests";

export const patientPaymentKeys = {
	all: ["patient", "payments"] as const,
	lists: () => [...patientPaymentKeys.all, "list"] as const,
	details: () => [...patientPaymentKeys.all, "detail"] as const,
	detail: (paymentId: number) =>
		[...patientPaymentKeys.details(), paymentId] as const,
};

export const patientPaymentQueries = {
	list: () =>
		queryOptions({
			queryKey: patientPaymentKeys.lists(),
			queryFn: listPayments,
		}),
	detail: (paymentId: number) =>
		queryOptions({
			queryKey: patientPaymentKeys.detail(paymentId),
			queryFn: () => getPayment(paymentId),
		}),
};
