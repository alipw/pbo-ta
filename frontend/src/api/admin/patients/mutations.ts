import {
	mutationOptions,
	useMutation,
	useQueryClient,
} from "@tanstack/react-query";

import { adminPatientKeys } from "./queries";
import { createPatient, deletePatient, updatePatient } from "./requests";
import type { PatientRequest, PatientResponse } from "./types";

type UpdatePatientVariables = {
	patientId: number;
	request: PatientRequest;
};

export const adminPatientMutations = {
	create: () =>
		mutationOptions<PatientResponse, Error, PatientRequest>({
			mutationKey: [...adminPatientKeys.all, "create"],
			mutationFn: createPatient,
		}),
	update: () =>
		mutationOptions<PatientResponse, Error, UpdatePatientVariables>({
			mutationKey: [...adminPatientKeys.all, "update"],
			mutationFn: ({ patientId, request }) => updatePatient(patientId, request),
		}),
	delete: () =>
		mutationOptions<void, Error, number>({
			mutationKey: [...adminPatientKeys.all, "delete"],
			mutationFn: deletePatient,
		}),
};

export function useCreatePatientMutation() {
	const queryClient = useQueryClient();

	return useMutation({
		...adminPatientMutations.create(),
		onSuccess: () => {
			void queryClient.invalidateQueries({
				queryKey: adminPatientKeys.lists(),
			});
		},
	});
}

export function useUpdatePatientMutation() {
	const queryClient = useQueryClient();

	return useMutation({
		...adminPatientMutations.update(),
		onSuccess: () => {
			void queryClient.invalidateQueries({
				queryKey: adminPatientKeys.lists(),
			});
		},
	});
}

export function useDeletePatientMutation() {
	const queryClient = useQueryClient();

	return useMutation({
		...adminPatientMutations.delete(),
		onSuccess: () => {
			void queryClient.invalidateQueries({
				queryKey: adminPatientKeys.lists(),
			});
		},
	});
}
