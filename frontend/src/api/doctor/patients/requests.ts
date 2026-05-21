import type { PatientResponse } from "@/api/admin/patients/types";
import { apiRequest } from "@/api/client";

const DOCTOR_PATIENTS_PATH = "/api/v1/doctor/patients";

export function listPatients() {
	return apiRequest<PatientResponse[]>(DOCTOR_PATIENTS_PATH);
}
