import { createFileRoute, redirect } from "@tanstack/react-router";

import { authQueries } from "@/api/auth/queries";
import { getCurrentUser, roleHomePath } from "@/lib/auth";

export const Route = createFileRoute("/")({
	beforeLoad: async ({ context }) => {
		const user = await context.queryClient.ensureQueryData(
			authQueries.currentUser(getCurrentUser),
		);

		if (!user) {
			throw redirect({ to: "/login" });
		}

		throw redirect({ to: roleHomePath[user.role] });
	},
});
