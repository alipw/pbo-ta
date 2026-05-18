export type UserRole = "ADMIN" | "DOCTOR" | "PATIENT";

export type AuthUser = {
	id: number;
	role: UserRole;
	fullName: string;
	email: string;
};

export type LoginRequest = {
	email: string;
	password: string;
};

export type LoginResponse = AuthUser;

export type CurrentUserResponse = AuthUser;

export type LogoutResponse = undefined;
