import { apiRequest } from "@/api/client";

import type { MedicalRecordResponse } from "./types";

const ADMIN_RECORDS_PATH = "/api/v1/admin/records";

export function listMedicalRecords() {
	return apiRequest<MedicalRecordResponse[]>(ADMIN_RECORDS_PATH);
}

export function getMedicalRecord(recordId: number) {
	return apiRequest<MedicalRecordResponse>(`${ADMIN_RECORDS_PATH}/${recordId}`);
}
