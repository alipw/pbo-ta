import type {
	AuthUser,
	CurrentUserResponse,
	LoginRequest,
	LoginResponse,
	LogoutResponse,
} from "@/api/auth/types";
import { ApiError, apiRequest } from "@/api/client";

const SESSION_COOKIE_NAME = "session";

export function login(request: LoginRequest) {
	return apiRequest<LoginResponse, LoginRequest>("/api/v1/auth/login", {
		method: "POST",
		body: request,
	});
}

export function logout() {
	return apiRequest<LogoutResponse>("/api/v1/auth/logout", {
		method: "POST",
	});
}

export function getCurrentUser() {
	return apiRequest<CurrentUserResponse>("/api/v1/auth/me");
}

export async function getOptionalCurrentUser(): Promise<AuthUser | null> {
	try {
		return await getCurrentUser();
	} catch (error) {
		if (
			error instanceof ApiError &&
			(error.status === 401 || error.status === 403)
		) {
			return null;
		}

		throw error;
	}
}

export async function getCurrentUserFromSession(
	sessionCookie: string | undefined,
): Promise<AuthUser | null> {
	if (!sessionCookie) {
		return null;
	}

	try {
		return await apiRequest<CurrentUserResponse>("/api/v1/auth/me", {
			headers: {
				Cookie: `${SESSION_COOKIE_NAME}=${encodeURIComponent(sessionCookie)}`,
			},
		});
	} catch (error) {
		if (
			error instanceof ApiError &&
			(error.status === 401 || error.status === 403)
		) {
			return null;
		}

		throw error;
	}
}

export { SESSION_COOKIE_NAME };
