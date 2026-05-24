import { queryOptions } from "@tanstack/react-query";

import { getPayment, listPayments } from "./requests";

export const adminPaymentKeys = {
	all: ["admin", "payments"] as const,
	lists: () => [...adminPaymentKeys.all, "list"] as const,
	details: () => [...adminPaymentKeys.all, "detail"] as const,
	detail: (paymentId: number) =>
		[...adminPaymentKeys.details(), paymentId] as const,
};

export const adminPaymentQueries = {
	list: () =>
		queryOptions({
			queryKey: adminPaymentKeys.lists(),
			queryFn: listPayments,
		}),
	detail: (paymentId: number) =>
		queryOptions({
			queryKey: adminPaymentKeys.detail(paymentId),
			queryFn: () => getPayment(paymentId),
		}),
};
