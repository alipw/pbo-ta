import { queryOptions } from "@tanstack/react-query";

import { listDoctors } from "./requests";

export const adminDoctorKeys = {
	all: ["admin", "doctors"] as const,
	lists: () => [...adminDoctorKeys.all, "list"] as const,
};

export const adminDoctorQueries = {
	list: () =>
		queryOptions({
			queryKey: adminDoctorKeys.lists(),
			queryFn: listDoctors,
		}),
};
