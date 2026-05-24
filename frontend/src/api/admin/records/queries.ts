import { queryOptions } from "@tanstack/react-query";

import { getMedicalRecord, listMedicalRecords } from "./requests";

export const adminMedicalRecordKeys = {
	all: ["admin", "records"] as const,
	lists: () => [...adminMedicalRecordKeys.all, "list"] as const,
	details: () => [...adminMedicalRecordKeys.all, "detail"] as const,
	detail: (recordId: number) =>
		[...adminMedicalRecordKeys.details(), recordId] as const,
};

export const adminMedicalRecordQueries = {
	list: () =>
		queryOptions({
			queryKey: adminMedicalRecordKeys.lists(),
			queryFn: listMedicalRecords,
		}),
	detail: (recordId: number) =>
		queryOptions({
			queryKey: adminMedicalRecordKeys.detail(recordId),
			queryFn: () => getMedicalRecord(recordId),
		}),
};
