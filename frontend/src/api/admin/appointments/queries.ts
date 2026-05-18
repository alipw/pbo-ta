import { queryOptions } from "@tanstack/react-query";

import { getAppointment, listAppointments } from "./requests";
import type { AppointmentFilters } from "./types";

export const adminAppointmentKeys = {
	all: ["admin", "appointments"] as const,
	lists: () => [...adminAppointmentKeys.all, "list"] as const,
	list: (filters?: AppointmentFilters) =>
		[...adminAppointmentKeys.lists(), filters ?? {}] as const,
	details: () => [...adminAppointmentKeys.all, "detail"] as const,
	detail: (appointmentId: number) =>
		[...adminAppointmentKeys.details(), appointmentId] as const,
};

export const adminAppointmentQueries = {
	list: (filters?: AppointmentFilters) =>
		queryOptions({
			queryKey: adminAppointmentKeys.list(filters),
			queryFn: () => listAppointments(filters),
		}),
	detail: (appointmentId: number) =>
		queryOptions({
			queryKey: adminAppointmentKeys.detail(appointmentId),
			queryFn: () => getAppointment(appointmentId),
		}),
};
