import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";

import { roleHomePath } from "@/lib/auth";

export const Route = createFileRoute("/_authenticated/doctor")({
	beforeLoad: ({ context }) => {
		const { user } = context;

		if (user.role !== "DOCTOR") {
			throw redirect({ to: roleHomePath[user.role] });
		}
	},
	component: DoctorLayout,
});

function DoctorLayout() {
	return <Outlet />;
}
