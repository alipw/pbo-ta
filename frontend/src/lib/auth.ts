import { createServerFn } from "@tanstack/react-start";
import { getCookie } from "@tanstack/react-start/server";

const SESSION_COOKIE_NAME = "session";
const API_BASE_URL =
	import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8080";

export type UserRole = "ADMIN" | "DOCTOR" | "PATIENT";

export type AuthUser = {
	id: number;
	role: UserRole;
	fullName: string;
	email: string;
};

export const roleHomePath: Record<UserRole, "/admin" | "/doctor" | "/patient"> =
	{
		ADMIN: "/admin",
		DOCTOR: "/doctor",
		PATIENT: "/patient",
	};

export const hasSessionCookie = createServerFn({ method: "GET" }).handler(() =>
	Boolean(getCookie(SESSION_COOKIE_NAME)),
);

export const getCurrentUser = createServerFn({ method: "GET" }).handler(
	async (): Promise<AuthUser | null> => {
		const sessionCookie = getCookie(SESSION_COOKIE_NAME);

		if (!sessionCookie) {
			return null;
		}

		const response = await fetch(`${API_BASE_URL}/api/v1/auth/me`, {
			headers: {
				Cookie: `${SESSION_COOKIE_NAME}=${encodeURIComponent(sessionCookie)}`,
			},
		});

		if (response.status === 401 || response.status === 403) {
			return null;
		}

		if (!response.ok) {
			throw new Error("Failed to load current user.");
		}

		return response.json();
	},
);
