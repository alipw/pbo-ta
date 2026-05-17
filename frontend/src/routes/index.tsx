import { createFileRoute, redirect } from "@tanstack/react-router";

import { getCurrentUser, roleHomePath } from "@/lib/auth";

export const Route = createFileRoute("/")({
	beforeLoad: async () => {
		const user = await getCurrentUser();

		if (!user) {
			throw redirect({ to: "/login" });
		}

		throw redirect({ to: roleHomePath[user.role] });
	},
});
