import type { UserRole } from "@/api/auth/types";

export type Patient = {
	id: number;
	role: UserRole;
	fullName: string;
	email: string;
	phoneNumber: string;
	dateOfBirth: string | null;
	createdAt: string;
	updatedAt: string;
};

export type PatientRequest = {
	fullName: string;
	email: string;
	password: string;
	phoneNumber: string;
	dateOfBirth: string | null;
};

export type PatientResponse = Patient;
