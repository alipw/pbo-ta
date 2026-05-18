import {
	mutationOptions,
	useMutation,
	useQueryClient,
} from "@tanstack/react-query";

import { adminDoctorKeys } from "./queries";
import { createDoctor, deleteDoctor, updateDoctor } from "./requests";
import type { DoctorRequest, DoctorResponse } from "./types";

type UpdateDoctorVariables = {
	doctorId: number;
	request: DoctorRequest;
};

export const adminDoctorMutations = {
	create: () =>
		mutationOptions<DoctorResponse, Error, DoctorRequest>({
			mutationKey: [...adminDoctorKeys.all, "create"],
			mutationFn: createDoctor,
		}),
	update: () =>
		mutationOptions<DoctorResponse, Error, UpdateDoctorVariables>({
			mutationKey: [...adminDoctorKeys.all, "update"],
			mutationFn: ({ doctorId, request }) => updateDoctor(doctorId, request),
		}),
	delete: () =>
		mutationOptions<void, Error, number>({
			mutationKey: [...adminDoctorKeys.all, "delete"],
			mutationFn: deleteDoctor,
		}),
};

export function useCreateDoctorMutation() {
	const queryClient = useQueryClient();

	return useMutation({
		...adminDoctorMutations.create(),
		onSuccess: () => {
			void queryClient.invalidateQueries({ queryKey: adminDoctorKeys.lists() });
		},
	});
}

export function useUpdateDoctorMutation() {
	const queryClient = useQueryClient();

	return useMutation({
		...adminDoctorMutations.update(),
		onSuccess: () => {
			void queryClient.invalidateQueries({ queryKey: adminDoctorKeys.lists() });
		},
	});
}

export function useDeleteDoctorMutation() {
	const queryClient = useQueryClient();

	return useMutation({
		...adminDoctorMutations.delete(),
		onSuccess: () => {
			void queryClient.invalidateQueries({ queryKey: adminDoctorKeys.lists() });
		},
	});
}
