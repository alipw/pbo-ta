import { createServerFn } from "@tanstack/react-start";
import { getCookie } from "@tanstack/react-start/server";

import {
	getCurrentUserFromSession,
	SESSION_COOKIE_NAME,
} from "@/api/auth/requests";
import type { AuthUser, UserRole } from "@/api/auth/types";

export type { AuthUser, UserRole } from "@/api/auth/types";

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
	async (): Promise<AuthUser | null> =>
		getCurrentUserFromSession(getCookie(SESSION_COOKIE_NAME)),
);
