import {
	mutationOptions,
	useMutation,
	useQueryClient,
} from "@tanstack/react-query";

import { adminDoctorKeys } from "./queries";
import { createDoctor } from "./requests";
import type { DoctorRequest, DoctorResponse } from "./types";

export const adminDoctorMutations = {
	create: () =>
		mutationOptions<DoctorResponse, Error, DoctorRequest>({
			mutationKey: [...adminDoctorKeys.all, "create"],
			mutationFn: createDoctor,
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
