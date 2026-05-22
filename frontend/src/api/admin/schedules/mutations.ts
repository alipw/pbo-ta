import {
	mutationOptions,
	useMutation,
	useQueryClient,
} from "@tanstack/react-query";

import { adminScheduleKeys } from "./queries";
import { createSchedule, deleteSchedule, updateSchedule } from "./requests";
import type { ScheduleRequest, ScheduleResponse } from "./types";

type UpdateScheduleVariables = {
	scheduleId: number;
	request: ScheduleRequest;
};

export const adminScheduleMutations = {
	create: () =>
		mutationOptions<ScheduleResponse, Error, ScheduleRequest>({
			mutationKey: [...adminScheduleKeys.all, "create"],
			mutationFn: createSchedule,
		}),
	update: () =>
		mutationOptions<ScheduleResponse, Error, UpdateScheduleVariables>({
			mutationKey: [...adminScheduleKeys.all, "update"],
			mutationFn: ({ scheduleId, request }) =>
				updateSchedule(scheduleId, request),
		}),
	delete: () =>
		mutationOptions<void, Error, number>({
			mutationKey: [...adminScheduleKeys.all, "delete"],
			mutationFn: deleteSchedule,
		}),
};

export function useCreateScheduleMutation() {
	const queryClient = useQueryClient();

	return useMutation({
		...adminScheduleMutations.create(),
		onSuccess: () => {
			void queryClient.invalidateQueries({
				queryKey: adminScheduleKeys.lists(),
			});
		},
	});
}

export function useUpdateScheduleMutation() {
	const queryClient = useQueryClient();

	return useMutation({
		...adminScheduleMutations.update(),
		onSuccess: (schedule) => {
			void queryClient.invalidateQueries({
				queryKey: adminScheduleKeys.lists(),
			});
			void queryClient.invalidateQueries({
				queryKey: adminScheduleKeys.detail(schedule.id),
			});
		},
	});
}

export function useDeleteScheduleMutation() {
	const queryClient = useQueryClient();

	return useMutation({
		...adminScheduleMutations.delete(),
		onSuccess: () => {
			void queryClient.invalidateQueries({
				queryKey: adminScheduleKeys.lists(),
			});
		},
	});
}
