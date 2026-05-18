import { queryOptions } from "@tanstack/react-query";

import { getOptionalCurrentUser } from "@/api/auth/requests";
import type { AuthUser } from "@/api/auth/types";

export const authKeys = {
	all: ["auth"] as const,
	currentUser: () => [...authKeys.all, "current-user"] as const,
};

export const authQueries = {
	currentUser: (
		queryFn: () => Promise<AuthUser | null> = getOptionalCurrentUser,
	) =>
		queryOptions({
			queryKey: authKeys.currentUser(),
			queryFn,
		}),
};
