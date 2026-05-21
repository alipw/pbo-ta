import { queryOptions } from "@tanstack/react-query";

import { getAppointment, listAppointments } from "./requests";
import type { AppointmentFilters } from "./types";

export const doctorAppointmentKeys = {
	all: ["doctor", "appointments"] as const,
	lists: () => [...doctorAppointmentKeys.all, "list"] as const,
	list: (filters?: AppointmentFilters) =>
		[...doctorAppointmentKeys.lists(), filters ?? {}] as const,
	details: () => [...doctorAppointmentKeys.all, "detail"] as const,
	detail: (appointmentId: number) =>
		[...doctorAppointmentKeys.details(), appointmentId] as const,
};

export const doctorAppointmentQueries = {
	list: (filters?: AppointmentFilters) =>
		queryOptions({
			queryKey: doctorAppointmentKeys.list(filters),
			queryFn: () => listAppointments(filters),
		}),
	detail: (appointmentId: number) =>
		queryOptions({
			queryKey: doctorAppointmentKeys.detail(appointmentId),
			queryFn: () => getAppointment(appointmentId),
		}),
};
