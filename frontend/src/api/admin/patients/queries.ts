import { queryOptions } from "@tanstack/react-query";

import { listPatients } from "./requests";

export const adminPatientKeys = {
	all: ["admin", "patients"] as const,
	lists: () => [...adminPatientKeys.all, "list"] as const,
};

export const adminPatientQueries = {
	list: () =>
		queryOptions({
			queryKey: adminPatientKeys.lists(),
			queryFn: listPatients,
		}),
};
