import {
	mutationOptions,
	useMutation,
	useQueryClient,
} from "@tanstack/react-query";

import { adminAppointmentKeys } from "./queries";
import {
	createAppointment,
	deleteAppointment,
	updateAppointment,
	updateAppointmentStatus,
} from "./requests";
import type {
	AppointmentRequest,
	AppointmentResponse,
	AppointmentStatusRequest,
} from "./types";

type UpdateAppointmentVariables = {
	appointmentId: number;
	request: AppointmentRequest;
};

type UpdateAppointmentStatusVariables = {
	appointmentId: number;
	request: AppointmentStatusRequest;
};

export const adminAppointmentMutations = {
	create: () =>
		mutationOptions<AppointmentResponse, Error, AppointmentRequest>({
			mutationKey: [...adminAppointmentKeys.all, "create"],
			mutationFn: createAppointment,
		}),
	update: () =>
		mutationOptions<AppointmentResponse, Error, UpdateAppointmentVariables>({
			mutationKey: [...adminAppointmentKeys.all, "update"],
			mutationFn: ({ appointmentId, request }) =>
				updateAppointment(appointmentId, request),
		}),
	updateStatus: () =>
		mutationOptions<
			AppointmentResponse,
			Error,
			UpdateAppointmentStatusVariables
		>({
			mutationKey: [...adminAppointmentKeys.all, "updateStatus"],
			mutationFn: ({ appointmentId, request }) =>
				updateAppointmentStatus(appointmentId, request),
		}),
	delete: () =>
		mutationOptions<void, Error, number>({
			mutationKey: [...adminAppointmentKeys.all, "delete"],
			mutationFn: deleteAppointment,
		}),
};

export function useCreateAppointmentMutation() {
	const queryClient = useQueryClient();

	return useMutation({
		...adminAppointmentMutations.create(),
		onSuccess: () => {
			void queryClient.invalidateQueries({
				queryKey: adminAppointmentKeys.lists(),
			});
		},
	});
}

export function useUpdateAppointmentMutation() {
	const queryClient = useQueryClient();

	return useMutation({
		...adminAppointmentMutations.update(),
		onSuccess: (appointment) => {
			void queryClient.invalidateQueries({
				queryKey: adminAppointmentKeys.lists(),
			});
			void queryClient.invalidateQueries({
				queryKey: adminAppointmentKeys.detail(appointment.id),
			});
		},
	});
}

export function useUpdateAppointmentStatusMutation() {
	const queryClient = useQueryClient();

	return useMutation({
		...adminAppointmentMutations.updateStatus(),
		onSuccess: (appointment) => {
			void queryClient.invalidateQueries({
				queryKey: adminAppointmentKeys.lists(),
			});
			void queryClient.invalidateQueries({
				queryKey: adminAppointmentKeys.detail(appointment.id),
			});
		},
	});
}

export function useDeleteAppointmentMutation() {
	const queryClient = useQueryClient();

	return useMutation({
		...adminAppointmentMutations.delete(),
		onSuccess: () => {
			void queryClient.invalidateQueries({
				queryKey: adminAppointmentKeys.lists(),
			});
		},
	});
}
