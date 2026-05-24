import type {
	EventClickArg,
	EventInput,
	EventMountArg,
} from "@fullcalendar/core";
import interactionPlugin from "@fullcalendar/interaction";
import FullCalendar from "@fullcalendar/react";
import timeGridPlugin from "@fullcalendar/timegrid";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, redirect } from "@tanstack/react-router";
import {
	AlertCircle,
	CalendarPlus,
	CheckCircle2,
	Clock3,
	Loader2,
	type LucideIcon,
	XCircle,
} from "lucide-react";
import type { FormEvent } from "react";
import { useMemo, useState } from "react";
import { ApiError } from "@/api/client";
import { useRequestAppointmentMutation } from "@/api/patient/appointments/mutations";
import { patientAppointmentQueries } from "@/api/patient/appointments/queries";
import type {
	Appointment,
	AppointmentStatus,
} from "@/api/patient/appointments/types";
import { patientScheduleQueries } from "@/api/patient/schedules/queries";
import type { Schedule } from "@/api/patient/schedules/types";
import { AdminFormDialog } from "@/components/admin/admin-dialogs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { roleHomePath } from "@/lib/auth";

type ApiErrorResponse = {
	message?: unknown;
};

const appointmentStatusLabels: Record<AppointmentStatus, string> = {
	MENUNGGU: "Menunggu",
	DISETUJUI: "Disetujui",
	SELESAI: "Selesai",
	DIBATALKAN: "Dibatalkan",
};

const appointmentStatusIcons: Record<AppointmentStatus, LucideIcon> = {
	MENUNGGU: Clock3,
	DISETUJUI: CheckCircle2,
	SELESAI: CheckCircle2,
	DIBATALKAN: XCircle,
};

const scheduleDateFormatter = new Intl.DateTimeFormat("id-ID", {
	dateStyle: "medium",
	timeStyle: "short",
});

const timeFormatter = new Intl.DateTimeFormat("id-ID", {
	hour: "2-digit",
	minute: "2-digit",
});

export const Route = createFileRoute("/_authenticated/patient/")({
	beforeLoad: ({ context }) => {
		const { user } = context;

		if (user.role !== "PATIENT") {
			throw redirect({ to: roleHomePath[user.role] });
		}
	},
	component: PatientAppointmentsPage,
});

function PatientAppointmentsPage() {
	const { user } = Route.useRouteContext();
	const schedulesQuery = useQuery({
		...patientScheduleQueries.availableList(),
		enabled: typeof window !== "undefined",
	});
	const appointmentsQuery = useQuery({
		...patientAppointmentQueries.list(),
		enabled: typeof window !== "undefined",
	});
	const requestAppointmentMutation = useRequestAppointmentMutation();
	const [selectedSchedule, setSelectedSchedule] = useState<Schedule | null>(
		null,
	);
	const [complaint, setComplaint] = useState("");
	const [formError, setFormError] = useState("");
	const [formSuccess, setFormSuccess] = useState("");

	const scheduleEvents = useMemo(
		() => (schedulesQuery.data ?? []).map(scheduleToEvent),
		[schedulesQuery.data],
	);
	const recentAppointments = useMemo(
		() =>
			(appointmentsQuery.data ?? [])
				.slice()
				.sort(
					(left, right) =>
						new Date(right.bookedAt).getTime() -
						new Date(left.bookedAt).getTime(),
				)
				.slice(0, 4),
		[appointmentsQuery.data],
	);
	const isCalendarLoading = schedulesQuery.isPending;

	function handleEventMount(arg: EventMountArg) {
		arg.el.dataset.scheduleId = arg.event.id;
	}

	function handleScheduleClick(arg: EventClickArg) {
		const scheduleId = Number(arg.event.id);
		const schedule =
			(schedulesQuery.data ?? []).find((item) => item.id === scheduleId) ??
			null;

		setSelectedSchedule(schedule);
		setComplaint("");
		setFormError("");
		setFormSuccess("");
	}

	async function handleRequestSubmit(event: FormEvent) {
		event.preventDefault();

		if (!selectedSchedule) {
			return;
		}

		setFormError("");
		setFormSuccess("");

		try {
			await requestAppointmentMutation.mutateAsync({
				scheduleId: selectedSchedule.id,
				complaint: complaint.trim() || undefined,
			});
			setFormSuccess("Pengajuan janji temu tersimpan.");
			setSelectedSchedule(null);
			setComplaint("");
		} catch (error) {
			setFormError(
				await getAppointmentFormErrorMessage(
					error,
					"Pengajuan janji temu gagal disimpan. Coba lagi.",
				),
			);
		}
	}

	return (
		<>
			<main className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-6 py-10">
				<section className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
					<div className="space-y-2">
						<p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
							Pasien
						</p>
						<h1 className="text-3xl font-semibold tracking-normal">
							Janji Temu
						</h1>
						<p className="max-w-2xl text-sm text-muted-foreground">
							Selamat datang, {user.fullName}. Jadwal tersedia berasal dari slot
							praktik dokter yang sudah dibuat admin.
						</p>
					</div>
				</section>

				{schedulesQuery.isError ? (
					<Alert variant="destructive">
						<AlertCircle className="size-4" />
						<AlertDescription>
							Jadwal tersedia gagal dimuat. Coba muat ulang halaman.
						</AlertDescription>
					</Alert>
				) : null}

				{appointmentsQuery.isError ? (
					<Alert variant="destructive">
						<AlertCircle className="size-4" />
						<AlertDescription>
							Daftar janji temu gagal dimuat. Coba muat ulang halaman.
						</AlertDescription>
					</Alert>
				) : null}

				{formSuccess ? (
					<Alert>
						<CheckCircle2 className="size-4" />
						<AlertDescription>{formSuccess}</AlertDescription>
					</Alert>
				) : null}

				<section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
					<section className="appointment-calendar min-h-[680px] rounded-lg border bg-card p-4 shadow-xs">
						{isCalendarLoading ? (
							<CalendarSkeleton />
						) : (
							<FullCalendar
								plugins={[timeGridPlugin, interactionPlugin]}
								initialView="timeGridWeek"
								headerToolbar={{
									left: "prev,next today",
									center: "title",
									right: "timeGridWeek,timeGridDay",
								}}
								allDaySlot={false}
								eventClick={handleScheduleClick}
								eventDidMount={handleEventMount}
								events={scheduleEvents}
								height="auto"
								locale="id"
								nowIndicator
								slotMinTime="07:00:00"
								slotMaxTime="21:00:00"
							/>
						)}
					</section>

					<section className="flex flex-col gap-4">
						<Card>
							<CardHeader>
								<CardTitle className="flex items-center gap-2 text-base">
									<CalendarPlus className="size-4" />
									Pengajuan Saya
								</CardTitle>
							</CardHeader>
							<CardContent className="space-y-3">
								{appointmentsQuery.isPending ? (
									<AppointmentListSkeleton />
								) : recentAppointments.length > 0 ? (
									recentAppointments.map((appointment) => (
										<AppointmentSummary
											key={appointment.id}
											appointment={appointment}
										/>
									))
								) : (
									<p className="text-sm text-muted-foreground">
										Belum ada pengajuan janji temu.
									</p>
								)}
							</CardContent>
						</Card>
					</section>
				</section>
			</main>

			<AdminFormDialog
				open={selectedSchedule !== null}
				onOpenChange={(open) => {
					if (!open && !requestAppointmentMutation.isPending) {
						setSelectedSchedule(null);
						setComplaint("");
						setFormError("");
					}
				}}
				title="Ajukan Janji Temu"
				description={
					selectedSchedule
						? `${selectedSchedule.doctorName} - ${scheduleDateFormatter.format(new Date(selectedSchedule.startsAt))}`
						: undefined
				}
				contentClassName="sm:max-w-xl"
			>
				<form className="space-y-4" onSubmit={handleRequestSubmit}>
					{formError ? (
						<Alert variant="destructive">
							<AlertCircle className="size-4" />
							<AlertDescription>{formError}</AlertDescription>
						</Alert>
					) : null}

					{selectedSchedule ? (
						<div className="grid gap-3 rounded-md border bg-muted/30 p-3 text-sm">
							<div className="flex items-center justify-between gap-3">
								<span className="text-muted-foreground">Dokter</span>
								<span className="text-right font-medium">
									{selectedSchedule.doctorName}
								</span>
							</div>
							<div className="flex items-center justify-between gap-3">
								<span className="text-muted-foreground">Waktu</span>
								<span className="text-right font-medium">
									{timeFormatter.format(new Date(selectedSchedule.startsAt))} -{" "}
									{timeFormatter.format(new Date(selectedSchedule.endsAt))}
								</span>
							</div>
							<div className="flex items-center justify-between gap-3">
								<span className="text-muted-foreground">Ruangan</span>
								<span className="text-right font-medium">
									{selectedSchedule.room ?? "-"}
								</span>
							</div>
						</div>
					) : null}

					<div className="space-y-2">
						<Label htmlFor="complaint">Keluhan</Label>
						<Textarea
							id="complaint"
							value={complaint}
							onChange={(event) => setComplaint(event.target.value)}
							placeholder="Keluhan singkat"
						/>
					</div>

					<DialogFooter className="-mx-4 border-t px-4 pt-4">
						<Button
							className="w-full"
							size="lg"
							type="submit"
							disabled={requestAppointmentMutation.isPending}
						>
							{requestAppointmentMutation.isPending ? (
								<Loader2 className="size-4 animate-spin" />
							) : (
								<CalendarPlus className="size-4" />
							)}
							{requestAppointmentMutation.isPending
								? "Mengajukan..."
								: "Ajukan Janji Temu"}
						</Button>
					</DialogFooter>
				</form>
			</AdminFormDialog>
		</>
	);
}

function scheduleToEvent(schedule: Schedule): EventInput {
	return {
		id: String(schedule.id),
		title: schedule.doctorName,
		start: schedule.startsAt,
		end: schedule.endsAt,
		backgroundColor: "#16a34a",
		borderColor: "#15803d",
		extendedProps: {
			room: schedule.room,
		},
	};
}

type AppointmentSummaryProps = {
	appointment: Appointment;
};

function AppointmentSummary({ appointment }: AppointmentSummaryProps) {
	const StatusIcon = appointmentStatusIcons[appointment.status];
	const startsAt = appointment.startsAt ?? appointment.bookedAt;

	return (
		<div className="rounded-md border p-3">
			<div className="flex items-start justify-between gap-3">
				<div className="min-w-0 space-y-1">
					<p className="truncate text-sm font-medium">
						{appointment.doctorName}
					</p>
					<p className="text-xs text-muted-foreground">
						{scheduleDateFormatter.format(new Date(startsAt))}
					</p>
				</div>
				<span className="inline-flex shrink-0 items-center gap-1 rounded-md border px-2 py-1 text-xs">
					<StatusIcon className="size-3" />
					{appointmentStatusLabels[appointment.status]}
				</span>
			</div>
		</div>
	);
}

async function getAppointmentFormErrorMessage(
	error: unknown,
	fallback: string,
) {
	const apiMessage = await getApiErrorMessage(error);

	if (apiMessage?.toLowerCase().includes("available")) {
		return "Jadwal ini sudah tidak tersedia.";
	}

	if (apiMessage?.toLowerCase().includes("already has an appointment")) {
		return "Jadwal ini sudah memiliki janji temu.";
	}

	return apiMessage ?? fallback;
}

async function getApiErrorMessage(error: unknown) {
	if (!(error instanceof ApiError)) {
		return null;
	}

	try {
		const body = (await error.response.json()) as ApiErrorResponse;
		return typeof body.message === "string" ? body.message : null;
	} catch {
		return null;
	}
}

function CalendarSkeleton() {
	return (
		<div className="space-y-4">
			<div className="flex items-center justify-between">
				<Skeleton className="h-10 w-52" />
				<Skeleton className="h-10 w-72" />
			</div>
			<div className="grid grid-cols-7 gap-2">
				{Array.from({ length: 35 }).map((_, index) => (
					<Skeleton key={index.toString()} className="h-24" />
				))}
			</div>
		</div>
	);
}

function AppointmentListSkeleton() {
	return (
		<div className="space-y-3">
			{Array.from({ length: 4 }).map((_, index) => (
				<Skeleton key={index.toString()} className="h-20" />
			))}
		</div>
	);
}
