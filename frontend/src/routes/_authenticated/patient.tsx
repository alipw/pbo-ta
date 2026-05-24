import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";

import { roleHomePath } from "@/lib/auth";

export const Route = createFileRoute("/_authenticated/patient")({
	beforeLoad: ({ context }) => {
		const { user } = context;

		if (user.role !== "PATIENT") {
			throw redirect({ to: roleHomePath[user.role] });
		}
	},
	component: PatientLayout,
});

function PatientLayout() {
	return <Outlet />;
}
