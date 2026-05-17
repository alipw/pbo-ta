import { createFileRoute, redirect } from "@tanstack/react-router";
import { CalendarPlus, CreditCard, FileText } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getCurrentUser, roleHomePath } from "@/lib/auth";

export const Route = createFileRoute("/patient")({
	beforeLoad: async () => {
		const user = await getCurrentUser();

		if (!user) {
			throw redirect({ to: "/login" });
		}

		if (user.role !== "PATIENT") {
			throw redirect({ to: roleHomePath[user.role] });
		}

		return { user };
	},
	component: PatientDashboard,
});

function PatientDashboard() {
	const { user } = Route.useRouteContext();

	return (
		<main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col gap-6 px-6 py-10">
			<section className="space-y-2">
				<p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
					Pasien
				</p>
				<h1 className="text-3xl font-semibold tracking-normal">
					Portal Pasien
				</h1>
				<p className="max-w-2xl text-sm text-muted-foreground">
					Selamat datang, {user.fullName}. Area pasien dapat diisi dengan
					appointment, rekam medis, dan pembayaran pribadi.
				</p>
			</section>

			<section className="grid gap-4 md:grid-cols-3">
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<CalendarPlus className="size-4" />
							Janji Temu
						</CardTitle>
					</CardHeader>
					<CardContent className="text-sm text-muted-foreground">
						Area untuk membuat dan melihat appointment.
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<FileText className="size-4" />
							Rekam Medis
						</CardTitle>
					</CardHeader>
					<CardContent className="text-sm text-muted-foreground">
						Area untuk melihat riwayat pemeriksaan.
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<CreditCard className="size-4" />
							Pembayaran
						</CardTitle>
					</CardHeader>
					<CardContent className="text-sm text-muted-foreground">
						Area untuk tagihan dan status pembayaran.
					</CardContent>
				</Card>
			</section>
		</main>
	);
}
