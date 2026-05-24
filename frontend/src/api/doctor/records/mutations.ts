import {
	mutationOptions,
	useMutation,
	useQueryClient,
} from "@tanstack/react-query";

import { doctorMedicalRecordKeys } from "./queries";
import { createMedicalRecord } from "./requests";
import type { MedicalRecordRequest, MedicalRecordResponse } from "./types";

export const doctorMedicalRecordMutations = {
	create: () =>
		mutationOptions<MedicalRecordResponse, Error, MedicalRecordRequest>({
			mutationKey: [...doctorMedicalRecordKeys.all, "create"],
			mutationFn: createMedicalRecord,
		}),
};

export function useCreateMedicalRecordMutation() {
	const queryClient = useQueryClient();

	return useMutation({
		...doctorMedicalRecordMutations.create(),
		onSuccess: (record) => {
			void queryClient.invalidateQueries({
				queryKey: doctorMedicalRecordKeys.lists(),
			});
			void queryClient.invalidateQueries({
				queryKey: doctorMedicalRecordKeys.detail(record.id),
			});
		},
	});
}
