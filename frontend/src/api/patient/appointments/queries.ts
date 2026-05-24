import { queryOptions } from "@tanstack/react-query";

import { getAppointment, listAppointments } from "./requests";
import type { AppointmentFilters } from "./types";

export const patientAppointmentKeys = {
	all: ["patient", "appointments"] as const,
	lists: () => [...patientAppointmentKeys.all, "list"] as const,
	list: (filters?: AppointmentFilters) =>
		[...patientAppointmentKeys.lists(), filters ?? {}] as const,
	details: () => [...patientAppointmentKeys.all, "detail"] as const,
	detail: (appointmentId: number) =>
		[...patientAppointmentKeys.details(), appointmentId] as const,
};

export const patientAppointmentQueries = {
	list: (filters?: AppointmentFilters) =>
		queryOptions({
			queryKey: patientAppointmentKeys.list(filters),
			queryFn: () => listAppointments(filters),
		}),
	detail: (appointmentId: number) =>
		queryOptions({
			queryKey: patientAppointmentKeys.detail(appointmentId),
			queryFn: () => getAppointment(appointmentId),
		}),
};
