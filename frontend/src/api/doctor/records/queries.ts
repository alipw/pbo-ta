import { queryOptions } from "@tanstack/react-query";

import { getMedicalRecord, listMedicalRecords } from "./requests";

export const doctorMedicalRecordKeys = {
	all: ["doctor", "records"] as const,
	lists: () => [...doctorMedicalRecordKeys.all, "list"] as const,
	details: () => [...doctorMedicalRecordKeys.all, "detail"] as const,
	detail: (recordId: number) =>
		[...doctorMedicalRecordKeys.details(), recordId] as const,
};

export const doctorMedicalRecordQueries = {
	list: () =>
		queryOptions({
			queryKey: doctorMedicalRecordKeys.lists(),
			queryFn: listMedicalRecords,
		}),
	detail: (recordId: number) =>
		queryOptions({
			queryKey: doctorMedicalRecordKeys.detail(recordId),
			queryFn: () => getMedicalRecord(recordId),
		}),
};
