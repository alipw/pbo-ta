import {
	mutationOptions,
	useMutation,
	useQueryClient,
} from "@tanstack/react-query";

import { adminPaymentKeys } from "./queries";
import { createPayment, updatePaymentStatus } from "./requests";
import type {
	PaymentRequest,
	PaymentResponse,
	PaymentStatusRequest,
} from "./types";

type UpdatePaymentStatusVariables = {
	paymentId: number;
	request: PaymentStatusRequest;
};

export const adminPaymentMutations = {
	create: () =>
		mutationOptions<PaymentResponse, Error, PaymentRequest>({
			mutationKey: [...adminPaymentKeys.all, "create"],
			mutationFn: createPayment,
		}),
	updateStatus: () =>
		mutationOptions<PaymentResponse, Error, UpdatePaymentStatusVariables>({
			mutationKey: [...adminPaymentKeys.all, "updateStatus"],
			mutationFn: ({ paymentId, request }) =>
				updatePaymentStatus(paymentId, request),
		}),
};

export function useCreatePaymentMutation() {
	const queryClient = useQueryClient();

	return useMutation({
		...adminPaymentMutations.create(),
		onSuccess: (payment) => {
			void queryClient.invalidateQueries({
				queryKey: adminPaymentKeys.lists(),
			});
			void queryClient.invalidateQueries({
				queryKey: adminPaymentKeys.detail(payment.id),
			});
		},
	});
}

export function useUpdatePaymentStatusMutation() {
	const queryClient = useQueryClient();

	return useMutation({
		...adminPaymentMutations.updateStatus(),
		onSuccess: (payment) => {
			void queryClient.invalidateQueries({
				queryKey: adminPaymentKeys.lists(),
			});
			void queryClient.invalidateQueries({
				queryKey: adminPaymentKeys.detail(payment.id),
			});
		},
	});
}
