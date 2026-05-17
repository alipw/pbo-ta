import { createFileRoute, redirect } from "@tanstack/react-router";
import { CalendarDays, ClipboardList, Stethoscope } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { hasSessionCookie } from "@/lib/auth";

export const Route = createFileRoute("/")({
	beforeLoad: async () => {
		const isAuthenticated = await hasSessionCookie();

		if (!isAuthenticated) {
			throw redirect({ to: "/login" });
		}
	},
	component: Home,
});

function Home() {
	return (
		<div className="min-h-screen bg-background">
			<main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col gap-6 px-6 py-10">
				<section className="space-y-2">
					<p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
						Klinikku
					</p>
					<h1 className="text-3xl font-semibold tracking-normal">Dashboard</h1>
					<p className="max-w-2xl text-sm text-muted-foreground">
						Ringkasan aktivitas klinik untuk jadwal, pasien, dan rekam medis.
					</p>
				</section>

				<section className="grid gap-4 md:grid-cols-3">
					<Card>
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<CalendarDays className="size-4" />
								Jadwal
							</CardTitle>
						</CardHeader>
						<CardContent className="text-sm text-muted-foreground">
							Kelola jadwal dokter dan status ketersediaan praktik.
						</CardContent>
					</Card>

					<Card>
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<Stethoscope className="size-4" />
								Pasien
							</CardTitle>
						</CardHeader>
						<CardContent className="text-sm text-muted-foreground">
							Akses data pasien dan kebutuhan appointment harian.
						</CardContent>
					</Card>

					<Card>
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<ClipboardList className="size-4" />
								Rekam Medis
							</CardTitle>
						</CardHeader>
						<CardContent className="text-sm text-muted-foreground">
							Pantau catatan pemeriksaan dan riwayat tindakan klinik.
						</CardContent>
					</Card>
				</section>
			</main>
		</div>
	);
}
