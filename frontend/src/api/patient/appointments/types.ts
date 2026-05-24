export type AppointmentStatus =
	| "MENUNGGU"
	| "DISETUJUI"
	| "SELESAI"
	| "DIBATALKAN";

export type Appointment = {
	id: number;
	patientId: number;
	patientName: string;
	doctorId: number;
	doctorName: string;
	scheduleId: number | null;
	startsAt: string | null;
	endsAt: string | null;
	room: string | null;
	scheduleNotes: string | null;
	status: AppointmentStatus;
	bookedAt: string;
	complaint: string | null;
	cancelledReason: string | null;
	createdAt: string;
	updatedAt: string;
};

export type AppointmentFilters = {
	doctorId?: number;
	status?: AppointmentStatus;
	from?: string;
	to?: string;
};

export type PatientAppointmentRequest = {
	scheduleId: number;
	complaint?: string;
};

export type PatientAppointmentCancelRequest = {
	cancelledReason?: string;
};

export type AppointmentResponse = Appointment;
