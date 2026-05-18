import { apiRequest } from "@/api/client";

import type { DoctorRequest, DoctorResponse } from "./types";

const ADMIN_DOCTORS_PATH = "/api/v1/admin/doctors";

export function listDoctors() {
	return apiRequest<DoctorResponse[]>(ADMIN_DOCTORS_PATH);
}

export function createDoctor(request: DoctorRequest) {
	return apiRequest<DoctorResponse, DoctorRequest>(ADMIN_DOCTORS_PATH, {
		method: "POST",
		body: request,
	});
}

export function updateDoctor(doctorId: number, request: DoctorRequest) {
	return apiRequest<DoctorResponse, DoctorRequest>(
		`${ADMIN_DOCTORS_PATH}/${doctorId}`,
		{
			method: "PUT",
			body: request,
		},
	);
}

export function deleteDoctor(doctorId: number) {
	return apiRequest<void>(`${ADMIN_DOCTORS_PATH}/${doctorId}`, {
		method: "DELETE",
	});
}
