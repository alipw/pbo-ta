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
	CircleOff,
	Clock3,
	type LucideIcon,
	Pencil,
	Plus,
	Trash2,
} from "lucide-react";
import type { FormEvent, MouseEvent } from "react";
import { useMemo, useRef, useState } from "react";
import { adminDoctorQueries } from "@/api/admin/doctors/queries";
import {
	useCreateScheduleMutation,
	useDeleteScheduleMutation,
	useUpdateScheduleMutation,
} from "@/api/admin/schedules/mutations";
import { adminScheduleQueries } from "@/api/admin/schedules/queries";
import type {
	Schedule,
	ScheduleRequest,
	ScheduleStatus,
} from "@/api/admin/schedules/types";
import { ApiError } from "@/api/client";
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
	ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { roleHomePath } from "@/lib/auth";

type ScheduleFormValues = {
	doctorId: string;
	scheduleDate: string;
	startTime: string;
	endTime: string;
	room: string;
	status: StandaloneScheduleStatus;
	notes: string;
};

type StandaloneScheduleStatus = Extract<
	ScheduleStatus,
	"AVAILABLE" | "CANCELLED"
>;

type ScheduleFormMode = "create" | "edit";

type ApiErrorResponse = {
	message?: unknown;
};

const statusLabels: Record<ScheduleStatus, string> = {
	AVAILABLE: "Tersedia",
	BOOKED: "Booked",
	CANCELLED: "Dibatalkan",
};

const statusColors: Record<ScheduleStatus, string> = {
	AVAILABLE: "#16a34a",
	BOOKED: "#2563eb",
	CANCELLED: "#dc2626",
};

const statusIcons: Record<ScheduleStatus, LucideIcon> = {
	AVAILABLE: CheckCircle2,
	BOOKED: Clock3,
	CANCELLED: CircleOff,
};

const standaloneScheduleStatuses: StandaloneScheduleStatus[] = [
	"AVAILABLE",
	"CANCELLED",
];

const scheduleDateFormatter = new Intl.DateTimeFormat("id-ID", {
	dateStyle: "medium",
	timeStyle: "short",
});

export const Route = createFileRoute("/_authenticated/admin/schedules")({
	beforeLoad: ({ context }) => {
		const { user } = context;

		if (user.role !== "ADMIN") {
			throw redirect({ to: roleHomePath[user.role] });
		}
	},
	component: AdminSchedulesPage,
});

function AdminSchedulesPage() {
	const schedulesQuery = useQuery({
		...adminScheduleQueries.list(),
		enabled: typeof window !== "undefined",
	});
	const doctorsQuery = useQuery({
		...adminDoctorQueries.list(),
		enabled: typeof window !== "undefined",
	});
	const createScheduleMutation = useCreateScheduleMutation();
	const updateScheduleMutation = useUpdateScheduleMutation();
	const deleteScheduleMutation = useDeleteScheduleMutation();
	const [scheduleFormMode, setScheduleFormMode] =
		useState<ScheduleFormMode>("create");
	const [isScheduleDialogOpen, setIsScheduleDialogOpen] = useState(false);
	const [editingScheduleId, setEditingScheduleId] = useState<number | null>(
		null,
	);
	const [contextScheduleId, setContextScheduleId] = useState<number | null>(
		null,
	);
	const [deleteScheduleCandidate, setDeleteScheduleCandidate] =
		useState<Schedule | null>(null);
	const [formValues, setFormValues] = useState<ScheduleFormValues>(() =>
		defaultScheduleFormValues(),
	);
	const [formError, setFormError] = useState("");
	const [actionError, setActionError] = useState("");
	const [deleteError, setDeleteError] = useState("");

	const scheduleEvents = useMemo(
		() => (schedulesQuery.data ?? []).map(scheduleToEvent),
		[schedulesQuery.data],
	);
	const contextSchedule = useMemo(
		() =>
			(schedulesQuery.data ?? []).find(
				(schedule) => schedule.id === contextScheduleId,
			) ?? null,
		[schedulesQuery.data, contextScheduleId],
	);
	const scheduleDialogTitle =
		scheduleFormMode === "create" ? "Tambah Jadwal" : "Edit Jadwal";
	const scheduleDialogDescription =
		scheduleFormMode === "create"
			? "Buat jadwal praktik dokter tanpa appointment pasien."
			: "Perbarui jadwal praktik dokter yang belum booked.";
	const isScheduleSaving =
		createScheduleMutation.isPending || updateScheduleMutation.isPending;
	const isDeletingSchedule = deleteScheduleMutation.isPending;
	const isCalendarLoading = schedulesQuery.isPending || doctorsQuery.isPending;

	function openCreateDialog(values?: Partial<ScheduleFormValues>) {
		setScheduleFormMode("create");
		setEditingScheduleId(null);
		setFormValues({
			...defaultScheduleFormValues(),
			...values,
		});
		setFormError("");
		setIsScheduleDialogOpen(true);
	}

	function openEditDialog(schedule: Schedule) {
		if (schedule.status === "BOOKED") {
			setActionError("Jadwal booked dikelola melalui appointment terkait.");
			return;
		}

		setScheduleFormMode("edit");
		setEditingScheduleId(schedule.id);
		setFormValues(scheduleToFormValues(schedule));
		setFormError("");
		setIsScheduleDialogOpen(true);
	}

	function handleCalendarSelect(selection: DateSelectArg) {
		openCreateDialog({
			...dateAndTimeFieldsFromRange(selection.start, selection.end),
		});
	}

	function handleEventMount(arg: EventMountArg) {
		arg.el.dataset.scheduleId = arg.event.id;
	}

	function handleCalendarContextMenu(event: MouseEvent<HTMLElement>) {
		const eventElement = (event.target as HTMLElement).closest<HTMLElement>(
			"[data-schedule-id]",
		);

		if (!eventElement?.dataset.scheduleId) {
			setContextScheduleId(null);
			event.preventDefault();
			return;
		}

		setContextScheduleId(Number(eventElement.dataset.scheduleId));
	}

	async function handleScheduleSubmit(event: FormEvent) {
		event.preventDefault();
		setFormError("");
		setActionError("");

		const request = scheduleRequestFromForm(formValues);

		if (!request) {
			setFormError(
				"Lengkapi dokter, tanggal, dan jam jadwal. Jam selesai harus setelah jam mulai.",
			);
			return;
		}

		try {
			if (scheduleFormMode === "edit" && editingScheduleId !== null) {
				await updateScheduleMutation.mutateAsync({
					scheduleId: editingScheduleId,
					request,
				});
				setEditingScheduleId(null);
				setIsScheduleDialogOpen(false);
			} else {
				await createScheduleMutation.mutateAsync(request);
				setFormValues(defaultScheduleFormValues());
				setIsScheduleDialogOpen(false);
			}
		} catch (error) {
			setFormError(
				await getScheduleFormErrorMessage(
					error,
					"Jadwal gagal disimpan. Periksa data lalu coba lagi.",
				),
			);
		}
	}

	async function handleDeleteSchedule() {
		if (!deleteScheduleCandidate) {
			return;
		}

		setDeleteError("");

		try {
			await deleteScheduleMutation.mutateAsync(deleteScheduleCandidate.id);
			setDeleteScheduleCandidate(null);
			setContextScheduleId(null);
		} catch (error) {
			setDeleteError(
				await getScheduleFormErrorMessage(
					error,
					"Jadwal gagal dihapus. Coba lagi.",
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
							Admin
						</p>
						<h1 className="text-3xl font-semibold tracking-normal">Jadwal</h1>
						<p className="max-w-2xl text-sm text-muted-foreground">
							Lihat dan buat jadwal praktik dokter tanpa membuat appointment.
						</p>
					</div>

					<AdminFormDialog
						open={isScheduleDialogOpen}
						onOpenChange={(open) => {
							setIsScheduleDialogOpen(open);

							if (open) {
								setFormError("");
							} else {
								setEditingScheduleId(null);
							}
						}}
						title={scheduleDialogTitle}
						description={scheduleDialogDescription}
						contentClassName="sm:max-w-2xl"
						trigger={
							<Button size="lg" onClick={() => openCreateDialog()}>
								<Plus className="size-4" />
								Tambah Jadwal
							</Button>
						}
					>
						<form className="space-y-4" onSubmit={handleScheduleSubmit}>
							{formError ? (
								<Alert variant="destructive">
									<AlertCircle className="size-4" />
									<AlertDescription>{formError}</AlertDescription>
								</Alert>
							) : null}

							<div className="grid gap-4 md:grid-cols-2">
								<ComboboxField
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
									id="scheduleDate"
									label="Tanggal Jadwal"
									type="date"
									value={formValues.scheduleDate}
									onChange={(scheduleDate) =>
										setFormValues((current) => ({
											...current,
											scheduleDate,
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

								<ComboboxField
									id="status"
									label="Status"
									value={formValues.status}
									placeholder="Pilih status"
									options={standaloneScheduleStatuses.map((status) => ({
										value: status,
										label: statusLabels[status],
									}))}
									onChange={(status) =>
										setFormValues((current) => ({
											...current,
											status: status as StandaloneScheduleStatus,
										}))
									}
								/>
							</div>

							<TextField
								id="notes"
								label="Catatan"
								value={formValues.notes}
								onChange={(notes) =>
									setFormValues((current) => ({ ...current, notes }))
								}
							/>

							<DialogFooter className="-mx-4 border-t px-4 pt-4">
								<Button
									className="w-full"
									size="lg"
									type="submit"
									disabled={isScheduleSaving}
								>
									<CalendarDays className="size-4" />
									{isScheduleSaving ? "Menyimpan..." : scheduleDialogTitle}
								</Button>
							</DialogFooter>
						</form>
					</AdminFormDialog>
				</section>

				{schedulesQuery.isError ? (
					<Alert variant="destructive">
						<AlertCircle className="size-4" />
						<AlertDescription>
							Daftar jadwal gagal dimuat. Coba muat ulang halaman.
						</AlertDescription>
					</Alert>
				) : null}

				{doctorsQuery.isError ? (
					<Alert variant="destructive">
						<AlertCircle className="size-4" />
						<AlertDescription>
							Data dokter gagal dimuat. Form tambah jadwal belum bisa digunakan.
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
									events={scheduleEvents}
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
					<ScheduleContextMenuContent
						schedule={contextSchedule}
						isDeletePending={isDeletingSchedule}
						onDelete={setDeleteScheduleCandidate}
						onEdit={openEditDialog}
					/>
				</ContextMenu>
			</main>

			<AdminDeleteDialog
				open={deleteScheduleCandidate !== null}
				onOpenChange={(open) => {
					if (!open && !isDeletingSchedule) {
						setDeleteScheduleCandidate(null);
						setDeleteError("");
					}
				}}
				title="Hapus jadwal?"
				description={
					deleteScheduleCandidate
						? `Jadwal ${deleteScheduleCandidate.doctorName} pada ${scheduleDateFormatter.format(new Date(deleteScheduleCandidate.startsAt))} akan dihapus. Tindakan ini tidak dapat dibatalkan.`
						: "Jadwal ini akan dihapus. Tindakan ini tidak dapat dibatalkan."
				}
				error={deleteError}
				isPending={isDeletingSchedule}
				confirmIcon={<Trash2 className="size-4" />}
				onConfirm={() => {
					void handleDeleteSchedule();
				}}
			/>
		</>
	);
}

function scheduleToEvent(schedule: Schedule): EventInput {
	const color = statusColors[schedule.status];

	return {
		id: String(schedule.id),
		title: `${schedule.doctorName} - ${statusLabels[schedule.status]}`,
		start: schedule.startsAt,
		end: schedule.endsAt,
		backgroundColor: color,
		borderColor: color,
		extendedProps: {
			status: statusLabels[schedule.status],
			room: schedule.room,
		},
	};
}

type ScheduleContextMenuContentProps = {
	schedule: Schedule | null;
	isDeletePending: boolean;
	onDelete: (schedule: Schedule) => void;
	onEdit: (schedule: Schedule) => void;
};

function ScheduleContextMenuContent({
	schedule,
	isDeletePending,
	onDelete,
	onEdit,
}: ScheduleContextMenuContentProps) {
	const isBooked = schedule?.status === "BOOKED";

	return (
		<ContextMenuContent className="w-60">
			{schedule ? (
				<>
					<ContextMenuLabel className="truncate">
						{schedule.doctorName}
					</ContextMenuLabel>
					<ContextMenuLabel className="truncate pt-0">
						{scheduleDateFormatter.format(new Date(schedule.startsAt))}
					</ContextMenuLabel>
					<ContextMenuLabel className="flex items-center gap-2 pt-0">
						{(() => {
							const StatusIcon = statusIcons[schedule.status];

							return <StatusIcon className="size-3.5" />;
						})()}
						{statusLabels[schedule.status]}
					</ContextMenuLabel>
					<ContextMenuSeparator />
					<ContextMenuItem
						disabled={isBooked}
						onSelect={() => onEdit(schedule)}
					>
						<Pencil className="size-3.5" />
						Edit Jadwal
					</ContextMenuItem>
					<ContextMenuItem
						variant="destructive"
						disabled={isDeletePending || isBooked}
						onSelect={() => onDelete(schedule)}
					>
						<Trash2 className="size-3.5" />
						Hapus Jadwal
					</ContextMenuItem>
					{isBooked ? (
						<>
							<ContextMenuSeparator />
							<ContextMenuLabel className="whitespace-normal text-muted-foreground">
								Jadwal booked dikelola melalui appointment.
							</ContextMenuLabel>
						</>
					) : null}
				</>
			) : (
				<ContextMenuLabel>Pilih jadwal</ContextMenuLabel>
			)}
		</ContextMenuContent>
	);
}

function defaultScheduleFormValues(): ScheduleFormValues {
	const startsAt = nextScheduleStart();
	const endsAt = new Date(startsAt.getTime() + 60 * 60 * 1000);
	const scheduleTime = dateAndTimeFieldsFromRange(startsAt, endsAt);

	return {
		doctorId: "",
		...scheduleTime,
		room: "",
		status: "AVAILABLE",
		notes: "",
	};
}

function scheduleToFormValues(schedule: Schedule): ScheduleFormValues {
	const scheduleTime = dateAndTimeFieldsFromRange(
		new Date(schedule.startsAt),
		new Date(schedule.endsAt),
	);

	return {
		doctorId: String(schedule.doctorId),
		...scheduleTime,
		room: schedule.room ?? "",
		status: schedule.status === "CANCELLED" ? "CANCELLED" : "AVAILABLE",
		notes: schedule.notes ?? "",
	};
}

function nextScheduleStart() {
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
		scheduleDate: startsAt.slice(0, 10),
		startTime: startsAt.slice(11, 16),
		endTime: endsAt.slice(11, 16),
	};
}

function scheduleRequestFromForm(
	value: ScheduleFormValues,
): ScheduleRequest | null {
	const doctorId = Number(value.doctorId);

	if (
		!Number.isFinite(doctorId) ||
		!value.scheduleDate ||
		!value.startTime ||
		!value.endTime ||
		value.endTime <= value.startTime
	) {
		return null;
	}

	const startsAt = `${value.scheduleDate}T${value.startTime}`;
	const endsAt = `${value.scheduleDate}T${value.endTime}`;

	return {
		doctorId,
		startsAt: new Date(startsAt).toISOString(),
		endsAt: new Date(endsAt).toISOString(),
		room: value.room.trim() || undefined,
		status: value.status,
		notes: value.notes.trim() || undefined,
	};
}

async function getScheduleFormErrorMessage(error: unknown, fallback: string) {
	const apiMessage = await getApiErrorMessage(error);

	if (apiMessage?.toLowerCase().includes("overlap")) {
		return "Jadwal bertabrakan dengan jadwal dokter yang sudah ada.";
	}

	if (apiMessage?.toLowerCase().includes("booked schedule")) {
		return "Jadwal booked dikelola melalui appointment terkait.";
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
	id: keyof ScheduleFormValues;
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
	id: keyof ScheduleFormValues;
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
