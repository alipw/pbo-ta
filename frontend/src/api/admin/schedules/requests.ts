import { apiRequest } from "@/api/client";

import type {
	ScheduleFilters,
	ScheduleRequest,
	ScheduleResponse,
} from "./types";

const ADMIN_SCHEDULES_PATH = "/api/v1/admin/schedules";

function scheduleSearchParams(filters: ScheduleFilters = {}) {
	const searchParams = new URLSearchParams();

	for (const [key, value] of Object.entries(filters)) {
		if (value !== undefined && value !== null && value !== "") {
			searchParams.set(key, String(value));
		}
	}

	return searchParams.toString();
}

export function listSchedules(filters?: ScheduleFilters) {
	const query = scheduleSearchParams(filters);

	return apiRequest<ScheduleResponse[]>(
		query ? `${ADMIN_SCHEDULES_PATH}?${query}` : ADMIN_SCHEDULES_PATH,
	);
}

export function getSchedule(scheduleId: number) {
	return apiRequest<ScheduleResponse>(`${ADMIN_SCHEDULES_PATH}/${scheduleId}`);
}

export function createSchedule(request: ScheduleRequest) {
	return apiRequest<ScheduleResponse, ScheduleRequest>(ADMIN_SCHEDULES_PATH, {
		method: "POST",
		body: request,
	});
}

export function updateSchedule(scheduleId: number, request: ScheduleRequest) {
	return apiRequest<ScheduleResponse, ScheduleRequest>(
		`${ADMIN_SCHEDULES_PATH}/${scheduleId}`,
		{
			method: "PUT",
			body: request,
		},
	);
}

export function deleteSchedule(scheduleId: number) {
	return apiRequest<void>(`${ADMIN_SCHEDULES_PATH}/${scheduleId}`, {
		method: "DELETE",
	});
}
