import { createFileRoute, redirect } from "@tanstack/react-router";
import { CalendarClock, ClipboardPlus, UserRound } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { roleHomePath } from "@/lib/auth";

export const Route = createFileRoute("/_authenticated/doctor")({
	beforeLoad: ({ context }) => {
		const { user } = context;

		if (user.role !== "DOCTOR") {
			throw redirect({ to: roleHomePath[user.role] });
		}
	},
	component: DoctorDashboard,
});

function DoctorDashboard() {
	const { user } = Route.useRouteContext();

	return (
		<main className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-6 py-10">
			<section className="space-y-2">
				<p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
					Dokter
				</p>
				<h1 className="text-3xl font-semibold tracking-normal">Ruang Dokter</h1>
				<p className="max-w-2xl text-sm text-muted-foreground">
					Selamat datang, {user.fullName}. Modul dokter dapat ditempatkan di
					area ini saat endpoint khusus dokter sudah tersedia.
				</p>
			</section>

			<section className="grid gap-4 md:grid-cols-3">
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<CalendarClock className="size-4" />
							Jadwal Saya
						</CardTitle>
					</CardHeader>
					<CardContent className="text-sm text-muted-foreground">
						Area untuk jadwal praktik dokter.
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<UserRound className="size-4" />
							Appointment
						</CardTitle>
					</CardHeader>
					<CardContent className="text-sm text-muted-foreground">
						Area untuk daftar janji temu dokter.
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<ClipboardPlus className="size-4" />
							Rekam Medis
						</CardTitle>
					</CardHeader>
					<CardContent className="text-sm text-muted-foreground">
						Area untuk catatan pemeriksaan pasien.
					</CardContent>
				</Card>
			</section>
		</main>
	);
}
