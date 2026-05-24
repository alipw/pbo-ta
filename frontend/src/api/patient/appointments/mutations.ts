import {
	mutationOptions,
	useMutation,
	useQueryClient,
} from "@tanstack/react-query";

import { patientScheduleKeys } from "@/api/patient/schedules/queries";
import { patientAppointmentKeys } from "./queries";
import { cancelAppointment, requestAppointment } from "./requests";
import type {
	AppointmentResponse,
	PatientAppointmentCancelRequest,
	PatientAppointmentRequest,
} from "./types";

type CancelAppointmentVariables = {
	appointmentId: number;
	request: PatientAppointmentCancelRequest;
};

export const patientAppointmentMutations = {
	request: () =>
		mutationOptions<AppointmentResponse, Error, PatientAppointmentRequest>({
			mutationKey: [...patientAppointmentKeys.all, "request"],
			mutationFn: requestAppointment,
		}),
	cancel: () =>
		mutationOptions<AppointmentResponse, Error, CancelAppointmentVariables>({
			mutationKey: [...patientAppointmentKeys.all, "cancel"],
			mutationFn: ({ appointmentId, request }) =>
				cancelAppointment(appointmentId, request),
		}),
};

export function useRequestAppointmentMutation() {
	const queryClient = useQueryClient();

	return useMutation({
		...patientAppointmentMutations.request(),
		onSuccess: () => {
			void queryClient.invalidateQueries({
				queryKey: patientScheduleKeys.availableLists(),
			});
			void queryClient.invalidateQueries({
				queryKey: patientAppointmentKeys.lists(),
			});
		},
	});
}

export function useCancelAppointmentMutation() {
	const queryClient = useQueryClient();

	return useMutation({
		...patientAppointmentMutations.cancel(),
		onSuccess: (appointment) => {
			void queryClient.invalidateQueries({
				queryKey: patientAppointmentKeys.lists(),
			});
			void queryClient.invalidateQueries({
				queryKey: patientAppointmentKeys.detail(appointment.id),
			});
		},
	});
}
