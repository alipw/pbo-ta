import { apiRequest } from "@/api/client";

import type {
	AppointmentFilters,
	AppointmentResponse,
	PatientAppointmentCancelRequest,
	PatientAppointmentRequest,
} from "./types";

const PATIENT_APPOINTMENTS_PATH = "/api/v1/patient/appointments";

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
		query ? `${PATIENT_APPOINTMENTS_PATH}?${query}` : PATIENT_APPOINTMENTS_PATH,
	);
}

export function getAppointment(appointmentId: number) {
	return apiRequest<AppointmentResponse>(
		`${PATIENT_APPOINTMENTS_PATH}/${appointmentId}`,
	);
}

export function requestAppointment(request: PatientAppointmentRequest) {
	return apiRequest<AppointmentResponse, PatientAppointmentRequest>(
		PATIENT_APPOINTMENTS_PATH,
		{
			method: "POST",
			body: request,
		},
	);
}

export function cancelAppointment(
	appointmentId: number,
	request: PatientAppointmentCancelRequest,
) {
	return apiRequest<AppointmentResponse, PatientAppointmentCancelRequest>(
		`${PATIENT_APPOINTMENTS_PATH}/${appointmentId}/cancel`,
		{
			method: "PATCH",
			body: request,
		},
	);
}
