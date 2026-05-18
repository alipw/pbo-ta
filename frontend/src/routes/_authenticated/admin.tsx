import { createFileRoute, redirect } from "@tanstack/react-router";
import {
	CalendarDays,
	ClipboardList,
	CreditCard,
	Stethoscope,
	Users,
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { roleHomePath } from "@/lib/auth";

export const Route = createFileRoute("/_authenticated/admin")({
	beforeLoad: ({ context }) => {
		const { user } = context;

		if (user.role !== "ADMIN") {
			throw redirect({ to: roleHomePath[user.role] });
		}
	},
	component: AdminDashboard,
});

const adminModules = [
	{
		title: "Dokter",
		description: "Kelola data dokter, spesialisasi, dan nomor lisensi.",
		icon: Stethoscope,
	},
	{
		title: "Pasien",
		description: "Kelola data pasien dan identitas kontak utama.",
		icon: Users,
	},
	{
		title: "Appointment",
		description: "Pantau dan buat janji temu lintas dokter dan pasien.",
		icon: CalendarDays,
	},
	{
		title: "Jadwal",
		description: "Atur jadwal praktik dan status ketersediaan dokter.",
		icon: ClipboardList,
	},
	{
		title: "Pembayaran",
		description: "Kelola transaksi pembayaran klinik.",
		icon: CreditCard,
	},
];

function AdminDashboard() {
	const { user } = Route.useRouteContext();

	return (
		<main className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-6 py-10">
			<section className="space-y-2">
				<p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
					Admin
				</p>
				<h1 className="text-3xl font-semibold tracking-normal">
					Dashboard Klinik
				</h1>
				<p className="max-w-2xl text-sm text-muted-foreground">
					Selamat datang, {user.fullName}. Area ini berisi modul operasional
					yang hanya dapat diakses admin.
				</p>
			</section>

			<section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
				{adminModules.map((module) => {
					const Icon = module.icon;

					return (
						<Card key={module.title}>
							<CardHeader>
								<CardTitle className="flex items-center gap-2">
									<Icon className="size-4" />
									{module.title}
								</CardTitle>
							</CardHeader>
							<CardContent className="text-sm text-muted-foreground">
								{module.description}
							</CardContent>
						</Card>
					);
				})}
			</section>
		</main>
	);
}
