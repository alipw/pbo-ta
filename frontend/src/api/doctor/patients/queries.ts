import { queryOptions } from "@tanstack/react-query";

import { listPatients } from "./requests";

export const doctorPatientKeys = {
	all: ["doctor", "patients"] as const,
	lists: () => [...doctorPatientKeys.all, "list"] as const,
};

export const doctorPatientQueries = {
	list: () =>
		queryOptions({
			queryKey: doctorPatientKeys.lists(),
			queryFn: listPatients,
		}),
};
