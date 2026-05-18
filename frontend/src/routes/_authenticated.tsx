import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";

import { authQueries } from "@/api/auth/queries";
import { AppSidebar } from "@/components/app-sidebar";
import {
	SidebarInset,
	SidebarProvider,
	SidebarTrigger,
} from "@/components/ui/sidebar";
import { getCurrentUser } from "@/lib/auth";

export const Route = createFileRoute("/_authenticated")({
	beforeLoad: async ({ context }) => {
		const user = await context.queryClient.ensureQueryData(
			authQueries.currentUser(getCurrentUser),
		);

		if (!user) {
			throw redirect({ to: "/login" });
		}

		return { user };
	},
	component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
	const { user } = Route.useRouteContext();

	return (
		<SidebarProvider>
			<AppSidebar userName={user.fullName} userRole={user.role} />
			<SidebarInset>
				<header className="flex h-12 shrink-0 items-center gap-2 border-b px-4">
					<SidebarTrigger className="-ml-1" />
				</header>
				<div className="flex-1">
					<Outlet />
				</div>
			</SidebarInset>
		</SidebarProvider>
	);
}
