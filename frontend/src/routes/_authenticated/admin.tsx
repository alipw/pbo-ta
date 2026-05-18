import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";

import { roleHomePath } from "@/lib/auth";

export const Route = createFileRoute("/_authenticated/admin")({
	beforeLoad: ({ context }) => {
		const { user } = context;

		if (user.role !== "ADMIN") {
			throw redirect({ to: roleHomePath[user.role] });
		}
	},
	component: AdminLayout,
});

function AdminLayout() {
	return <Outlet />;
}
