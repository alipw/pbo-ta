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
import { useMemo, useRef, useState } from "react";
import { ApiError } from "@/api/client";
import {
	useCreateAppointmentMutation,
	useDeleteAppointmentMutation,
	useUpdateAppointmentMutation,
	useUpdateAppointmentStatusMutation,
} from "@/api/doctor/appointments/mutations";
import { doctorAppointmentQueries } from "@/api/doctor/appointments/queries";
import type {
	Appointment,
	AppointmentRequest,
	AppointmentStatus,
} from "@/api/doctor/appointments/types";
import { doctorPatientQueries } from "@/api/doctor/patients/queries";
import {
	AdminDeleteDialog,
	AdminFormDialog,
} from "@/components/admin/admin-dialogs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
	Combobox,
	ComboboxContent,
	ComboboxEmpty,
	ComboboxInput,
	ComboboxItem,
	ComboboxList,
} from "@/components/ui/combobox";
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
import { DialogFooter } from "@/components/ui/dialog";
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

export const Route = createFileRoute("/_authenticated/doctor/appointments")({
	beforeLoad: ({ context }) => {
		const { user } = context;

		if (user.role !== "DOCTOR") {
			throw redirect({ to: roleHomePath[user.role] });
		}
	},
	component: DoctorAppointmentsPage,
});

function DoctorAppointmentsPage() {
	const { user } = Route.useRouteContext();
	const appointmentsQuery = useQuery({
		...doctorAppointmentQueries.list(),
		enabled: typeof window !== "undefined",
	});
	const patientsQuery = useQuery({
		...doctorPatientQueries.list(),
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
		defaultAppointmentFormValues(user.id),
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
			...defaultAppointmentFormValues(user.id),
			...values,
			doctorId: String(user.id),
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
				setEditingAppointmentId(null);
				setIsAppointmentDialogOpen(false);
			} else {
				await createAppointmentMutation.mutateAsync(request);
				setFormValues(defaultAppointmentFormValues(user.id));
				setIsAppointmentDialogOpen(false);
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
							? contextAppointment.cancelledReason || "Dibatalkan oleh dokter"
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
		appointmentsQuery.isPending || patientsQuery.isPending;

	return (
		<>
			<main className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-6 py-10">
				<section className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
					<div className="space-y-2">
						<p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
							Dokter
						</p>
						<h1 className="text-3xl font-semibold tracking-normal">
							Appointment
						</h1>
						<p className="max-w-2xl text-sm text-muted-foreground">
							Lihat appointment Anda dan buat slot baru untuk pasien.
						</p>
					</div>

					<AdminFormDialog
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
						title={appointmentDialogTitle}
						description={appointmentDialogDescription}
						contentClassName="sm:max-w-2xl"
						trigger={
							<Button size="lg" onClick={() => openCreateDialog()}>
								<Plus className="size-4" />
								Tambah Appointment
							</Button>
						}
					>
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
								<ComboboxField
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
									id="room"
									label="Ruangan"
									value={formValues.room}
									onChange={(room) =>
										setFormValues((current) => ({ ...current, room }))
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
									id="complaint"
									label="Keluhan"
									value={formValues.complaint}
									onChange={(complaint) =>
										setFormValues((current) => ({ ...current, complaint }))
									}
								/>

								<ComboboxField
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
					</AdminFormDialog>
				</section>

				{appointmentsQuery.isError ? (
					<Alert variant="destructive">
						<AlertCircle className="size-4" />
						<AlertDescription>
							Daftar appointment gagal dimuat. Coba muat ulang halaman.
						</AlertDescription>
					</Alert>
				) : null}

				{patientsQuery.isError ? (
					<Alert variant="destructive">
						<AlertCircle className="size-4" />
						<AlertDescription>
							Data pasien gagal dimuat. Form tambah appointment belum bisa
							digunakan.
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

			<AdminDeleteDialog
				open={deleteAppointmentCandidate !== null}
				onOpenChange={(open) => {
					if (!open && !isDeletingAppointment) {
						setDeleteAppointmentCandidate(null);
						setDeleteError("");
					}
				}}
				title="Hapus appointment?"
				description={
					deleteAppointmentCandidate
						? `Appointment untuk ${deleteAppointmentCandidate.patientName} akan dihapus bersama jadwal dokter yang dibuat dari appointment ini. Tindakan ini tidak dapat dibatalkan.`
						: "Appointment ini akan dihapus bersama jadwal dokter yang dibuat dari appointment ini."
				}
				error={deleteError}
				isPending={isDeletingAppointment}
				confirmIcon={<Trash2 className="size-4" />}
				onConfirm={() => {
					void handleDeleteAppointment();
				}}
			/>
		</>
	);
}

function appointmentToEvent(appointment: Appointment): EventInput {
	const color = statusColors[appointment.status];

	return {
		id: String(appointment.id),
		title: appointment.patientName,
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

function defaultAppointmentFormValues(
	doctorId?: number,
): AppointmentFormValues {
	const startsAt = nextAppointmentStart();
	const endsAt = new Date(startsAt.getTime() + 30 * 60 * 1000);
	const appointmentTime = dateAndTimeFieldsFromRange(startsAt, endsAt);

	return {
		patientId: "",
		doctorId: doctorId === undefined ? "" : String(doctorId),
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

type ComboboxOption = {
	value: string;
	label: string;
};

type ComboboxFieldProps = {
	id: keyof AppointmentFormValues;
	label: string;
	value: string;
	placeholder: string;
	options: ComboboxOption[];
	disabled?: boolean;
	onChange: (value: string) => void;
};

function ComboboxField({
	id,
	label,
	value,
	placeholder,
	options,
	disabled,
	onChange,
}: ComboboxFieldProps) {
	const portalContainerRef = useRef<HTMLDivElement>(null);
	const selectedOption =
		options.find((option) => option.value === value) ?? null;

	return (
		<div ref={portalContainerRef} className="space-y-2">
			<Label htmlFor={id}>{label}</Label>
			<Combobox<ComboboxOption>
				items={options}
				value={selectedOption}
				disabled={disabled}
				itemToStringValue={(option) => option.label}
				isItemEqualToValue={(itemValue, selectedValue) =>
					itemValue.value === selectedValue.value
				}
				onValueChange={(option) => onChange(option?.value ?? "")}
			>
				<ComboboxInput
					id={id}
					className="w-full"
					placeholder={placeholder}
					disabled={disabled}
					showClear
				/>
				<ComboboxContent container={portalContainerRef}>
					<ComboboxEmpty>Tidak ada pilihan</ComboboxEmpty>
					<ComboboxList>
						{(option: ComboboxOption) => (
							<ComboboxItem key={option.value} value={option}>
								{option.label}
							</ComboboxItem>
						)}
					</ComboboxList>
				</ComboboxContent>
			</Combobox>
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
