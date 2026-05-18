import { apiRequest } from "@/api/client";

import type { PatientRequest, PatientResponse } from "./types";

const ADMIN_PATIENTS_PATH = "/api/v1/admin/patients";

export function listPatients() {
	return apiRequest<PatientResponse[]>(ADMIN_PATIENTS_PATH);
}

export function createPatient(request: PatientRequest) {
	return apiRequest<PatientResponse, PatientRequest>(ADMIN_PATIENTS_PATH, {
		method: "POST",
		body: request,
	});
}

export function updatePatient(patientId: number, request: PatientRequest) {
	return apiRequest<PatientResponse, PatientRequest>(
		`${ADMIN_PATIENTS_PATH}/${patientId}`,
		{
			method: "PUT",
			body: request,
		},
	);
}

export function deletePatient(patientId: number) {
	return apiRequest<void>(`${ADMIN_PATIENTS_PATH}/${patientId}`, {
		method: "DELETE",
	});
}
