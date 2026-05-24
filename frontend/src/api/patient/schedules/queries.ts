import { queryOptions } from "@tanstack/react-query";

import { listAvailableSchedules } from "./requests";
import type { AvailableScheduleFilters } from "./types";

export const patientScheduleKeys = {
	all: ["patient", "schedules"] as const,
	availableLists: () => [...patientScheduleKeys.all, "available"] as const,
	availableList: (filters?: AvailableScheduleFilters) =>
		[...patientScheduleKeys.availableLists(), filters ?? {}] as const,
};

export const patientScheduleQueries = {
	availableList: (filters?: AvailableScheduleFilters) =>
		queryOptions({
			queryKey: patientScheduleKeys.availableList(filters),
			queryFn: () => listAvailableSchedules(filters),
		}),
};
