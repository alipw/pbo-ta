export type ScheduleStatus = "AVAILABLE" | "BOOKED" | "CANCELLED";

export type Schedule = {
	id: number;
	doctorId: number;
	doctorName: string;
	startsAt: string;
	endsAt: string;
	room: string | null;
	status: ScheduleStatus;
	notes: string | null;
	createdAt: string;
	updatedAt: string;
};

export type ScheduleFilters = {
	doctorId?: number;
	status?: ScheduleStatus;
	from?: string;
	to?: string;
};

export type ScheduleRequest = {
	doctorId: number;
	startsAt: string;
	endsAt: string;
	room?: string;
	status?: ScheduleStatus;
	notes?: string;
};

export type ScheduleResponse = Schedule;
