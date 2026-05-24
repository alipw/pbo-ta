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

export type AvailableScheduleFilters = {
	doctorId?: number;
	from?: string;
	to?: string;
};

export type ScheduleResponse = Schedule;
