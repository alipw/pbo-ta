import { apiRequest } from "@/api/client";

import type { AvailableScheduleFilters, ScheduleResponse } from "./types";

const PATIENT_AVAILABLE_SCHEDULES_PATH = "/api/v1/patient/schedules/available";

function scheduleSearchParams(filters: AvailableScheduleFilters = {}) {
	const searchParams = new URLSearchParams();

	for (const [key, value] of Object.entries(filters)) {
		if (value !== undefined && value !== null && value !== "") {
			searchParams.set(key, String(value));
		}
	}

	return searchParams.toString();
}

export function listAvailableSchedules(filters?: AvailableScheduleFilters) {
	const query = scheduleSearchParams(filters);

	return apiRequest<ScheduleResponse[]>(
		query
			? `${PATIENT_AVAILABLE_SCHEDULES_PATH}?${query}`
			: PATIENT_AVAILABLE_SCHEDULES_PATH,
	);
}
