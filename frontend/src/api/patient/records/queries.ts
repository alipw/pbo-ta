import { queryOptions } from "@tanstack/react-query";

import { getMedicalRecord, listMedicalRecords } from "./requests";

export const patientMedicalRecordKeys = {
	all: ["patient", "records"] as const,
	lists: () => [...patientMedicalRecordKeys.all, "list"] as const,
	details: () => [...patientMedicalRecordKeys.all, "detail"] as const,
	detail: (recordId: number) =>
		[...patientMedicalRecordKeys.details(), recordId] as const,
};

export const patientMedicalRecordQueries = {
	list: () =>
		queryOptions({
			queryKey: patientMedicalRecordKeys.lists(),
			queryFn: listMedicalRecords,
		}),
	detail: (recordId: number) =>
		queryOptions({
			queryKey: patientMedicalRecordKeys.detail(recordId),
			queryFn: () => getMedicalRecord(recordId),
		}),
};
