import type { UserRole } from "@/api/auth/types";

export type Doctor = {
	id: number;
	role: UserRole;
	fullName: string;
	email: string;
	specialization: string;
	licenseNumber: string;
	createdAt: string;
	updatedAt: string;
};

export type DoctorRequest = {
	fullName: string;
	email: string;
	password: string;
	specialization: string;
	licenseNumber: string;
};

export type DoctorResponse = Doctor;
