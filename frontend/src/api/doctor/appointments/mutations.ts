import {
	mutationOptions,
	useMutation,
	useQueryClient,
} from "@tanstack/react-query";

import { doctorAppointmentKeys } from "./queries";
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

export const doctorAppointmentMutations = {
	create: () =>
		mutationOptions<AppointmentResponse, Error, AppointmentRequest>({
			mutationKey: [...doctorAppointmentKeys.all, "create"],
			mutationFn: createAppointment,
		}),
	update: () =>
		mutationOptions<AppointmentResponse, Error, UpdateAppointmentVariables>({
			mutationKey: [...doctorAppointmentKeys.all, "update"],
			mutationFn: ({ appointmentId, request }) =>
				updateAppointment(appointmentId, request),
		}),
	updateStatus: () =>
		mutationOptions<
			AppointmentResponse,
			Error,
			UpdateAppointmentStatusVariables
		>({
			mutationKey: [...doctorAppointmentKeys.all, "updateStatus"],
			mutationFn: ({ appointmentId, request }) =>
				updateAppointmentStatus(appointmentId, request),
		}),
	delete: () =>
		mutationOptions<void, Error, number>({
			mutationKey: [...doctorAppointmentKeys.all, "delete"],
			mutationFn: deleteAppointment,
		}),
};

export function useCreateAppointmentMutation() {
	const queryClient = useQueryClient();

	return useMutation({
		...doctorAppointmentMutations.create(),
		onSuccess: () => {
			void queryClient.invalidateQueries({
				queryKey: doctorAppointmentKeys.lists(),
			});
		},
	});
}

export function useUpdateAppointmentMutation() {
	const queryClient = useQueryClient();

	return useMutation({
		...doctorAppointmentMutations.update(),
		onSuccess: (appointment) => {
			void queryClient.invalidateQueries({
				queryKey: doctorAppointmentKeys.lists(),
			});
			void queryClient.invalidateQueries({
				queryKey: doctorAppointmentKeys.detail(appointment.id),
			});
		},
	});
}

export function useUpdateAppointmentStatusMutation() {
	const queryClient = useQueryClient();

	return useMutation({
		...doctorAppointmentMutations.updateStatus(),
		onSuccess: (appointment) => {
			void queryClient.invalidateQueries({
				queryKey: doctorAppointmentKeys.lists(),
			});
			void queryClient.invalidateQueries({
				queryKey: doctorAppointmentKeys.detail(appointment.id),
			});
		},
	});
}

export function useDeleteAppointmentMutation() {
	const queryClient = useQueryClient();

	return useMutation({
		...doctorAppointmentMutations.delete(),
		onSuccess: () => {
			void queryClient.invalidateQueries({
				queryKey: doctorAppointmentKeys.lists(),
			});
		},
	});
}
