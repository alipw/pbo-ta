import { apiRequest } from "@/api/client";

import type { MedicalRecordRequest, MedicalRecordResponse } from "./types";

const DOCTOR_RECORDS_PATH = "/api/v1/doctor/records";

export function listMedicalRecords() {
	return apiRequest<MedicalRecordResponse[]>(DOCTOR_RECORDS_PATH);
}

export function getMedicalRecord(recordId: number) {
	return apiRequest<MedicalRecordResponse>(`${DOCTOR_RECORDS_PATH}/${recordId}`);
}

export function createMedicalRecord(request: MedicalRecordRequest) {
	return apiRequest<MedicalRecordResponse, MedicalRecordRequest>(
		DOCTOR_RECORDS_PATH,
		{
			method: "POST",
			body: request,
		},
	);
}
