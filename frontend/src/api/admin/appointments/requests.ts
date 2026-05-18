import { apiRequest } from "@/api/client";

import type {
	AppointmentFilters,
	AppointmentRequest,
	AppointmentResponse,
} from "./types";

const ADMIN_APPOINTMENTS_PATH = "/api/v1/admin/appointments";

function appointmentSearchParams(filters: AppointmentFilters = {}) {
	const searchParams = new URLSearchParams();

	for (const [key, value] of Object.entries(filters)) {
		if (value !== undefined && value !== null && value !== "") {
			searchParams.set(key, String(value));
		}
	}

	return searchParams.toString();
}

export function listAppointments(filters?: AppointmentFilters) {
	const query = appointmentSearchParams(filters);

	return apiRequest<AppointmentResponse[]>(
		query ? `${ADMIN_APPOINTMENTS_PATH}?${query}` : ADMIN_APPOINTMENTS_PATH,
	);
}

export function getAppointment(appointmentId: number) {
	return apiRequest<AppointmentResponse>(
		`${ADMIN_APPOINTMENTS_PATH}/${appointmentId}`,
	);
}

export function createAppointment(request: AppointmentRequest) {
	return apiRequest<AppointmentResponse, AppointmentRequest>(
		ADMIN_APPOINTMENTS_PATH,
		{
			method: "POST",
			body: request,
		},
	);
}

export function updateAppointment(
	appointmentId: number,
	request: AppointmentRequest,
) {
	return apiRequest<AppointmentResponse, AppointmentRequest>(
		`${ADMIN_APPOINTMENTS_PATH}/${appointmentId}`,
		{
			method: "PUT",
			body: request,
		},
	);
}

export function deleteAppointment(appointmentId: number) {
	return apiRequest<void>(`${ADMIN_APPOINTMENTS_PATH}/${appointmentId}`, {
		method: "DELETE",
	});
}
