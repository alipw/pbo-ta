import { queryOptions } from "@tanstack/react-query";

import { getSchedule, listSchedules } from "./requests";
import type { ScheduleFilters } from "./types";

export const adminScheduleKeys = {
	all: ["admin", "schedules"] as const,
	lists: () => [...adminScheduleKeys.all, "list"] as const,
	list: (filters?: ScheduleFilters) =>
		[...adminScheduleKeys.lists(), filters ?? {}] as const,
	details: () => [...adminScheduleKeys.all, "detail"] as const,
	detail: (scheduleId: number) =>
		[...adminScheduleKeys.details(), scheduleId] as const,
};

export const adminScheduleQueries = {
	list: (filters?: ScheduleFilters) =>
		queryOptions({
			queryKey: adminScheduleKeys.list(filters),
			queryFn: () => listSchedules(filters),
		}),
	detail: (scheduleId: number) =>
		queryOptions({
			queryKey: adminScheduleKeys.detail(scheduleId),
			queryFn: () => getSchedule(scheduleId),
		}),
};
