import type {
	DateSelectArg,
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
	CalendarDays,
	CheckCircle2,
	CircleDot,
	Clock3,
	type LucideIcon,
	Pencil,
	Plus,
	Trash2,
	XCircle,
} from "lucide-react";
import type { FormEvent, MouseEvent } from "react";
import { useMemo, useState } from "react";

import {
	useCreateAppointmentMutation,
	useDeleteAppointmentMutation,
	useUpdateAppointmentMutation,
	useUpdateAppointmentStatusMutation,
} from "@/api/admin/appointments/mutations";
import { adminAppointmentQueries } from "@/api/admin/appointments/queries";
import type {
	Appointment,
	AppointmentRequest,
	AppointmentStatus,
} from "@/api/admin/appointments/types";
import { adminDoctorQueries } from "@/api/admin/doctors/queries";
import { adminPatientQueries } from "@/api/admin/patients/queries";
import { ApiError } from "@/api/client";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
	AlertDialog,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
	ContextMenu,
	ContextMenuContent,
	ContextMenuItem,
	ContextMenuLabel,
	ContextMenuSeparator,
	ContextMenuSub,
	ContextMenuSubContent,
	ContextMenuSubTrigger,
	ContextMenuTrigger,
} from "@/components/ui/context-menu";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { roleHomePath } from "@/lib/auth";

type AppointmentFormValues = {
	patientId: string;
	doctorId: string;
	appointmentDate: string;
	startTime: string;
	endTime: string;
	room: string;
	scheduleNotes: string;
	status: AppointmentStatus;
	complaint: string;
	cancelledReason: string;
};

type AppointmentFormMode = "create" | "edit";

type ApiErrorResponse = {
	message?: unknown;
};

const statusLabels: Record<AppointmentStatus, string> = {
	MENUNGGU: "Menunggu",
	DISETUJUI: "Disetujui",
	SELESAI: "Selesai",
	DIBATALKAN: "Dibatalkan",
};

const statusColors: Record<AppointmentStatus, string> = {
	MENUNGGU: "#ca8a04",
	DISETUJUI: "#2563eb",
	SELESAI: "#16a34a",
	DIBATALKAN: "#dc2626",
};

const statusIcons: Record<AppointmentStatus, LucideIcon> = {
	MENUNGGU: Clock3,
	DISETUJUI: CircleDot,
	SELESAI: CheckCircle2,
	DIBATALKAN: XCircle,
};

const appointmentStatuses = Object.keys(statusLabels) as AppointmentStatus[];

const appointmentDateFormatter = new Intl.DateTimeFormat("id-ID", {
	dateStyle: "medium",
	timeStyle: "short",
});

export const Route = createFileRoute("/_authenticated/admin/appointments")({
	beforeLoad: ({ context }) => {
		const { user } = context;

		if (user.role !== "ADMIN") {
			throw redirect({ to: roleHomePath[user.role] });
		}
	},
	component: AdminAppointmentsPage,
});

function AdminAppointmentsPage() {
	const appointmentsQuery = useQuery({
		...adminAppointmentQueries.list(),
		enabled: typeof window !== "undefined",
	});
	const patientsQuery = useQuery({
		...adminPatientQueries.list(),
		enabled: typeof window !== "undefined",
	});
	const doctorsQuery = useQuery({
		...adminDoctorQueries.list(),
		enabled: typeof window !== "undefined",
	});
	const createAppointmentMutation = useCreateAppointmentMutation();
	const updateAppointmentMutation = useUpdateAppointmentMutation();
	const updateAppointmentStatusMutation = useUpdateAppointmentStatusMutation();
	const deleteAppointmentMutation = useDeleteAppointmentMutation();
	const [appointmentFormMode, setAppointmentFormMode] =
		useState<AppointmentFormMode>("create");
	const [isAppointmentDialogOpen, setIsAppointmentDialogOpen] = useState(false);
	const [editingAppointmentId, setEditingAppointmentId] = useState<
		number | null
	>(null);
	const [contextAppointmentId, setContextAppointmentId] = useState<
		number | null
	>(null);
	const [deleteAppointmentCandidate, setDeleteAppointmentCandidate] =
		useState<Appointment | null>(null);
	const [formValues, setFormValues] = useState<AppointmentFormValues>(() =>
		defaultAppointmentFormValues(),
	);
	const [formError, setFormError] = useState("");
	const [formSuccess, setFormSuccess] = useState("");
	const [actionError, setActionError] = useState("");
	const [deleteError, setDeleteError] = useState("");

	const appointmentEvents = useMemo(
		() => (appointmentsQuery.data ?? []).map(appointmentToEvent),
		[appointmentsQuery.data],
	);
	const contextAppointment = useMemo(
		() =>
			(appointmentsQuery.data ?? []).find(
				(appointment) => appointment.id === contextAppointmentId,
			) ?? null,
		[appointmentsQuery.data, contextAppointmentId],
	);
	const appointmentDialogTitle =
		appointmentFormMode === "create"
			? "Tambah Appointment"
			: "Edit Appointment";
	const appointmentDialogDescription =
		appointmentFormMode === "create"
			? "Appointment baru akan membuat jadwal dokter berstatus booked."
			: "Perbarui data appointment dan jadwal dokter yang terhubung.";
	const isAppointmentSaving =
		createAppointmentMutation.isPending || updateAppointmentMutation.isPending;
	const isDeletingAppointment = deleteAppointmentMutation.isPending;

	function openCreateDialog(values?: Partial<AppointmentFormValues>) {
		setAppointmentFormMode("create");
		setEditingAppointmentId(null);
		setFormValues({
			...defaultAppointmentFormValues(),
			...values,
		});
		setFormError("");
		setFormSuccess("");
		setIsAppointmentDialogOpen(true);
	}

	function openEditDialog(appointment: Appointment) {
		setAppointmentFormMode("edit");
		setEditingAppointmentId(appointment.id);
		setFormValues(appointmentToFormValues(appointment));
		setFormError("");
		setFormSuccess("");
		setIsAppointmentDialogOpen(true);
	}

	function handleCalendarSelect(selection: DateSelectArg) {
		openCreateDialog({
			...dateAndTimeFieldsFromRange(selection.start, selection.end),
		});
	}

	function handleEventMount(arg: EventMountArg) {
		arg.el.dataset.appointmentId = arg.event.id;
	}

	function handleCalendarContextMenu(event: MouseEvent<HTMLElement>) {
		const eventElement = (event.target as HTMLElement).closest<HTMLElement>(
			"[data-appointment-id]",
		);

		if (!eventElement?.dataset.appointmentId) {
			setContextAppointmentId(null);
			event.preventDefault();
			return;
		}

		setContextAppointmentId(Number(eventElement.dataset.appointmentId));
	}

	async function handleAppointmentSubmit(event: FormEvent) {
		event.preventDefault();
		setFormError("");
		setFormSuccess("");
		setActionError("");

		const request = appointmentRequestFromForm(formValues);

		if (!request) {
			setFormError(
				"Lengkapi pasien, dokter, tanggal, dan jam appointment. Jam selesai harus setelah jam mulai.",
			);
			return;
		}

		try {
			if (appointmentFormMode === "edit" && editingAppointmentId !== null) {
				await updateAppointmentMutation.mutateAsync({
					appointmentId: editingAppointmentId,
					request,
				});
				setFormSuccess("Appointment berhasil diperbarui.");
			} else {
				await createAppointmentMutation.mutateAsync(request);
				setFormValues(defaultAppointmentFormValues());
				setFormSuccess("Appointment berhasil dibuat.");
			}
		} catch (error) {
			setFormError(
				await getAppointmentFormErrorMessage(
					error,
					"Appointment gagal disimpan. Periksa data lalu coba lagi.",
				),
			);
		}
	}

	async function handleStatusChange(status: AppointmentStatus) {
		if (!contextAppointment) {
			return;
		}

		setActionError("");

		try {
			await updateAppointmentStatusMutation.mutateAsync({
				appointmentId: contextAppointment.id,
				request: {
					status,
					cancelledReason:
						status === "DIBATALKAN"
							? contextAppointment.cancelledReason || "Dibatalkan oleh admin"
							: undefined,
				},
			});
		} catch {
			setActionError("Status appointment gagal diperbarui. Coba lagi.");
		}
	}

	async function handleDeleteAppointment() {
		if (!deleteAppointmentCandidate) {
			return;
		}

		setDeleteError("");

		try {
			await deleteAppointmentMutation.mutateAsync(
				deleteAppointmentCandidate.id,
			);
			setDeleteAppointmentCandidate(null);
			setContextAppointmentId(null);
		} catch {
			setDeleteError(
				"Appointment dan jadwal terkait gagal dihapus. Coba lagi.",
			);
		}
	}

	const isCalendarLoading =
		appointmentsQuery.isPending ||
		patientsQuery.isPending ||
		doctorsQuery.isPending;

	return (
		<>
			<main className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-6 py-10">
				<section className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
					<div className="space-y-2">
						<p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
							Admin
						</p>
						<h1 className="text-3xl font-semibold tracking-normal">
							Appointment
						</h1>
						<p className="max-w-2xl text-sm text-muted-foreground">
							Lihat jadwal appointment dan buat slot baru untuk pasien dan
							dokter.
						</p>
					</div>

					<Dialog
						open={isAppointmentDialogOpen}
						onOpenChange={(open) => {
							setIsAppointmentDialogOpen(open);

							if (open) {
								setFormError("");
								setFormSuccess("");
							} else {
								setEditingAppointmentId(null);
							}
						}}
					>
						<DialogTrigger asChild>
							<Button size="lg" onClick={() => openCreateDialog()}>
								<Plus className="size-4" />
								Tambah Appointment
							</Button>
						</DialogTrigger>
						<DialogContent className="sm:max-w-2xl">
							<DialogHeader>
								<DialogTitle>{appointmentDialogTitle}</DialogTitle>
								<DialogDescription>
									{appointmentDialogDescription}
								</DialogDescription>
							</DialogHeader>

							<form className="space-y-4" onSubmit={handleAppointmentSubmit}>
								{formError ? (
									<Alert variant="destructive">
										<AlertCircle className="size-4" />
										<AlertDescription>{formError}</AlertDescription>
									</Alert>
								) : null}

								{formSuccess ? (
									<Alert>
										<AlertDescription>{formSuccess}</AlertDescription>
									</Alert>
								) : null}

								<div className="grid gap-4 md:grid-cols-2">
									<SelectField
										id="patientId"
										label="Pasien"
										value={formValues.patientId}
										disabled={patientsQuery.isPending}
										placeholder="Pilih pasien"
										options={(patientsQuery.data ?? []).map((patient) => ({
											value: String(patient.id),
											label: patient.fullName,
										}))}
										onChange={(patientId) =>
											setFormValues((current) => ({ ...current, patientId }))
										}
									/>

									<SelectField
										id="doctorId"
										label="Dokter"
										value={formValues.doctorId}
										disabled={doctorsQuery.isPending}
										placeholder="Pilih dokter"
										options={(doctorsQuery.data ?? []).map((doctor) => ({
											value: String(doctor.id),
											label: `${doctor.fullName} - ${doctor.specialization}`,
										}))}
										onChange={(doctorId) =>
											setFormValues((current) => ({ ...current, doctorId }))
										}
									/>

									<TextField
										id="appointmentDate"
										label="Tanggal Appointment"
										type="date"
										value={formValues.appointmentDate}
										onChange={(appointmentDate) =>
											setFormValues((current) => ({
												...current,
												appointmentDate,
											}))
										}
									/>

									<TextField
										id="startTime"
										label="Jam Mulai"
										type="time"
										value={formValues.startTime}
										onChange={(startTime) =>
											setFormValues((current) => ({ ...current, startTime }))
										}
									/>

									<TextField
										id="endTime"
										label="Jam Selesai"
										type="time"
										value={formValues.endTime}
										onChange={(endTime) =>
											setFormValues((current) => ({ ...current, endTime }))
										}
									/>

									<TextField
										id="room"
										label="Ruangan"
										value={formValues.room}
										onChange={(room) =>
											setFormValues((current) => ({ ...current, room }))
										}
									/>

									<TextField
										id="complaint"
										label="Keluhan"
										value={formValues.complaint}
										onChange={(complaint) =>
											setFormValues((current) => ({ ...current, complaint }))
										}
									/>

									<SelectField
										id="status"
										label="Status"
										value={formValues.status}
										placeholder="Pilih status"
										options={appointmentStatuses.map((status) => ({
											value: status,
											label: statusLabels[status],
										}))}
										onChange={(status) =>
											setFormValues((current) => ({
												...current,
												status: status as AppointmentStatus,
											}))
										}
									/>
								</div>

								<TextField
									id="scheduleNotes"
									label="Catatan Jadwal"
									value={formValues.scheduleNotes}
									onChange={(scheduleNotes) =>
										setFormValues((current) => ({ ...current, scheduleNotes }))
									}
								/>

								{formValues.status === "DIBATALKAN" ? (
									<TextField
										id="cancelledReason"
										label="Alasan Pembatalan"
										value={formValues.cancelledReason}
										onChange={(cancelledReason) =>
											setFormValues((current) => ({
												...current,
												cancelledReason,
											}))
										}
									/>
								) : null}

								<DialogFooter className="-mx-4 border-t px-4 pt-4">
									<Button
										className="w-full"
										size="lg"
										type="submit"
										disabled={isAppointmentSaving}
									>
										<CalendarDays className="size-4" />
										{isAppointmentSaving
											? "Menyimpan..."
											: appointmentDialogTitle}
									</Button>
								</DialogFooter>
							</form>
						</DialogContent>
					</Dialog>
				</section>

				{appointmentsQuery.isError ? (
					<Alert variant="destructive">
						<AlertCircle className="size-4" />
						<AlertDescription>
							Daftar appointment gagal dimuat. Coba muat ulang halaman.
						</AlertDescription>
					</Alert>
				) : null}

				{patientsQuery.isError || doctorsQuery.isError ? (
					<Alert variant="destructive">
						<AlertCircle className="size-4" />
						<AlertDescription>
							Data pasien atau dokter gagal dimuat. Form tambah appointment
							belum bisa digunakan.
						</AlertDescription>
					</Alert>
				) : null}

				{actionError ? (
					<Alert variant="destructive">
						<AlertCircle className="size-4" />
						<AlertDescription>{actionError}</AlertDescription>
					</Alert>
				) : null}

				<ContextMenu>
					<ContextMenuTrigger asChild>
						<section
							className="appointment-calendar min-h-[680px] rounded-lg border bg-card p-4 shadow-xs"
							onContextMenuCapture={handleCalendarContextMenu}
						>
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
									eventDidMount={handleEventMount}
									events={appointmentEvents}
									height="auto"
									locale="id"
									nowIndicator
									select={handleCalendarSelect}
									selectMirror
									selectable
									slotMinTime="07:00:00"
									slotMaxTime="21:00:00"
								/>
							)}
						</section>
					</ContextMenuTrigger>
					<AppointmentContextMenuContent
						appointment={contextAppointment}
						isDeletePending={isDeletingAppointment}
						isStatusPending={updateAppointmentStatusMutation.isPending}
						onDelete={setDeleteAppointmentCandidate}
						onEdit={openEditDialog}
						onStatusChange={(status) => {
							void handleStatusChange(status);
						}}
					/>
				</ContextMenu>
			</main>

			<AlertDialog
				open={deleteAppointmentCandidate !== null}
				onOpenChange={(open) => {
					if (!open && !isDeletingAppointment) {
						setDeleteAppointmentCandidate(null);
						setDeleteError("");
					}
				}}
			>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Hapus appointment?</AlertDialogTitle>
						<AlertDialogDescription>
							{deleteAppointmentCandidate
								? `Appointment untuk ${deleteAppointmentCandidate.patientName} akan dihapus bersama jadwal dokter yang dibuat dari appointment ini. Tindakan ini tidak dapat dibatalkan.`
								: "Appointment ini akan dihapus bersama jadwal dokter yang dibuat dari appointment ini."}
						</AlertDialogDescription>
					</AlertDialogHeader>

					{deleteError ? (
						<Alert variant="destructive">
							<AlertCircle className="size-4" />
							<AlertDescription>{deleteError}</AlertDescription>
						</Alert>
					) : null}

					<AlertDialogFooter className="-mx-4 border-t px-4 pt-4">
						<AlertDialogCancel disabled={isDeletingAppointment}>
							Batal
						</AlertDialogCancel>
						<Button
							type="button"
							variant="destructive"
							disabled={isDeletingAppointment}
							onClick={() => {
								void handleDeleteAppointment();
							}}
						>
							<Trash2 className="size-4" />
							{isDeletingAppointment ? "Menghapus..." : "Hapus"}
						</Button>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</>
	);
}

function appointmentToEvent(appointment: Appointment): EventInput {
	const color = statusColors[appointment.status];

	return {
		id: String(appointment.id),
		title: `${appointment.patientName} - ${appointment.doctorName}`,
		start: appointment.startsAt ?? appointment.bookedAt,
		end: appointment.endsAt ?? undefined,
		backgroundColor: color,
		borderColor: color,
		extendedProps: {
			status: statusLabels[appointment.status],
			room: appointment.room,
		},
	};
}

type AppointmentContextMenuContentProps = {
	appointment: Appointment | null;
	isDeletePending: boolean;
	isStatusPending: boolean;
	onDelete: (appointment: Appointment) => void;
	onEdit: (appointment: Appointment) => void;
	onStatusChange: (status: AppointmentStatus) => void;
};

function AppointmentContextMenuContent({
	appointment,
	isDeletePending,
	isStatusPending,
	onDelete,
	onEdit,
	onStatusChange,
}: AppointmentContextMenuContentProps) {
	return (
		<ContextMenuContent className="w-56">
			{appointment ? (
				<>
					<ContextMenuLabel className="truncate">
						{appointment.patientName}
					</ContextMenuLabel>
					<ContextMenuLabel className="truncate pt-0">
						{appointment.startsAt
							? appointmentDateFormatter.format(new Date(appointment.startsAt))
							: statusLabels[appointment.status]}
					</ContextMenuLabel>
					<ContextMenuItem onSelect={() => onEdit(appointment)}>
						<Pencil className="size-3.5" />
						Edit Appointment
					</ContextMenuItem>
					<ContextMenuSeparator />
					<ContextMenuSub>
						<ContextMenuSubTrigger disabled={isStatusPending}>
							<CircleDot className="size-3.5" />
							Ubah Status
						</ContextMenuSubTrigger>
						<ContextMenuSubContent className="w-44">
							{appointmentStatuses.map((status) => {
								const StatusIcon = statusIcons[status];

								return (
									<ContextMenuItem
										key={status}
										disabled={isStatusPending || appointment.status === status}
										onSelect={() => onStatusChange(status)}
									>
										<StatusIcon className="size-3.5" />
										{statusLabels[status]}
									</ContextMenuItem>
								);
							})}
						</ContextMenuSubContent>
					</ContextMenuSub>
					<ContextMenuItem
						variant="destructive"
						disabled={isStatusPending || appointment.status === "DIBATALKAN"}
						onSelect={() => onStatusChange("DIBATALKAN")}
					>
						<XCircle className="size-3.5" />
						Batalkan Appointment
					</ContextMenuItem>
					<ContextMenuSeparator />
					<ContextMenuItem
						variant="destructive"
						disabled={isDeletePending}
						onSelect={() => onDelete(appointment)}
					>
						<Trash2 className="size-3.5" />
						Hapus Appointment
					</ContextMenuItem>
				</>
			) : (
				<ContextMenuLabel>Pilih appointment</ContextMenuLabel>
			)}
		</ContextMenuContent>
	);
}

function defaultAppointmentFormValues(): AppointmentFormValues {
	const startsAt = nextAppointmentStart();
	const endsAt = new Date(startsAt.getTime() + 30 * 60 * 1000);
	const appointmentTime = dateAndTimeFieldsFromRange(startsAt, endsAt);

	return {
		patientId: "",
		doctorId: "",
		...appointmentTime,
		room: "",
		scheduleNotes: "",
		status: "MENUNGGU",
		complaint: "",
		cancelledReason: "",
	};
}

function appointmentToFormValues(
	appointment: Appointment,
): AppointmentFormValues {
	const appointmentTime =
		appointment.startsAt && appointment.endsAt
			? dateAndTimeFieldsFromRange(
					new Date(appointment.startsAt),
					new Date(appointment.endsAt),
				)
			: { appointmentDate: "", startTime: "", endTime: "" };

	return {
		patientId: String(appointment.patientId),
		doctorId: String(appointment.doctorId),
		...appointmentTime,
		room: appointment.room ?? "",
		scheduleNotes: appointment.scheduleNotes ?? "",
		status: appointment.status,
		complaint: appointment.complaint ?? "",
		cancelledReason: appointment.cancelledReason ?? "",
	};
}

function nextAppointmentStart() {
	const date = new Date();
	date.setDate(date.getDate() + 1);
	date.setHours(9, 0, 0, 0);
	return date;
}

function toDateTimeLocalValue(date: Date) {
	const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
	return localDate.toISOString().slice(0, 16);
}

function dateAndTimeFieldsFromRange(start: Date, end: Date) {
	const startsAt = toDateTimeLocalValue(start);
	const endsAt = toDateTimeLocalValue(end);

	return {
		appointmentDate: startsAt.slice(0, 10),
		startTime: startsAt.slice(11, 16),
		endTime: endsAt.slice(11, 16),
	};
}

function appointmentRequestFromForm(
	value: AppointmentFormValues,
): AppointmentRequest | null {
	const patientId = Number(value.patientId);
	const doctorId = Number(value.doctorId);

	if (
		!Number.isFinite(patientId) ||
		!Number.isFinite(doctorId) ||
		!value.appointmentDate ||
		!value.startTime ||
		!value.endTime ||
		value.endTime <= value.startTime
	) {
		return null;
	}

	const startsAt = `${value.appointmentDate}T${value.startTime}`;
	const endsAt = `${value.appointmentDate}T${value.endTime}`;

	return {
		patientId,
		doctorId,
		startsAt: new Date(startsAt).toISOString(),
		endsAt: new Date(endsAt).toISOString(),
		room: value.room.trim() || undefined,
		scheduleNotes: value.scheduleNotes.trim() || undefined,
		status: value.status,
		complaint: value.complaint.trim() || undefined,
		cancelledReason:
			value.status === "DIBATALKAN"
				? value.cancelledReason.trim() || undefined
				: undefined,
	};
}

async function getAppointmentFormErrorMessage(
	error: unknown,
	fallback: string,
) {
	const apiMessage = await getApiErrorMessage(error);

	if (apiMessage?.toLowerCase().includes("overlap")) {
		return "Jadwal appointment bertabrakan dengan jadwal dokter yang sudah ada.";
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

type SelectFieldProps = {
	id: keyof AppointmentFormValues;
	label: string;
	value: string;
	placeholder: string;
	options: Array<{ value: string; label: string }>;
	disabled?: boolean;
	onChange: (value: string) => void;
};

function SelectField({
	id,
	label,
	value,
	placeholder,
	options,
	disabled,
	onChange,
}: SelectFieldProps) {
	return (
		<div className="space-y-2">
			<Label htmlFor={id}>{label}</Label>
			<select
				id={id}
				className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50"
				value={value}
				disabled={disabled}
				onChange={(event) => onChange(event.target.value)}
			>
				<option value="">{placeholder}</option>
				{options.map((option) => (
					<option key={option.value} value={option.value}>
						{option.label}
					</option>
				))}
			</select>
		</div>
	);
}

type TextFieldProps = {
	id: keyof AppointmentFormValues;
	label: string;
	value: string;
	type?: React.HTMLInputTypeAttribute;
	onChange: (value: string) => void;
};

function TextField({
	id,
	label,
	value,
	type = "text",
	onChange,
}: TextFieldProps) {
	return (
		<div className="space-y-2">
			<Label htmlFor={id}>{label}</Label>
			<Input
				id={id}
				type={type}
				value={value}
				onChange={(event) => onChange(event.target.value)}
			/>
		</div>
	);
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
