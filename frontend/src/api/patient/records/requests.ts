import { apiRequest } from "@/api/client";

import type { MedicalRecordResponse } from "./types";

const PATIENT_RECORDS_PATH = "/api/v1/patient/records";

export function listMedicalRecords() {
	return apiRequest<MedicalRecordResponse[]>(PATIENT_RECORDS_PATH);
}

export function getMedicalRecord(recordId: number) {
	return apiRequest<MedicalRecordResponse>(`${PATIENT_RECORDS_PATH}/${recordId}`);
}
