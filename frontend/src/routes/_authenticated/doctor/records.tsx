import { useQuery } from "@tanstack/react-query";
import { createFileRoute, redirect } from "@tanstack/react-router";
import {
	type ColumnDef,
	flexRender,
	getCoreRowModel,
	useReactTable,
} from "@tanstack/react-table";
import {
	AlertCircle,
	ClipboardPlus,
	Eye,
	FileText,
	Plus,
} from "lucide-react";
import type { FormEvent } from "react";
import { useMemo, useState } from "react";

import { ApiError } from "@/api/client";
import { doctorAppointmentQueries } from "@/api/doctor/appointments/queries";
import type { Appointment } from "@/api/doctor/appointments/types";
import { useCreateMedicalRecordMutation } from "@/api/doctor/records/mutations";
import { doctorMedicalRecordQueries } from "@/api/doctor/records/queries";
import type {
	MedicalRecord,
	MedicalRecordRequest,
} from "@/api/doctor/records/types";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { roleHomePath } from "@/lib/auth";

type MedicalRecordFormValues = {
	appointmentId: string;
	symptoms: string;
	diagnosis: string;
	treatmentNotes: string;
};

type ApiErrorResponse = {
	message?: unknown;
};

const emptyRecordFormValues: MedicalRecordFormValues = {
	appointmentId: "",
	symptoms: "",
	diagnosis: "",
	treatmentNotes: "",
};

const recordDateFormatter = new Intl.DateTimeFormat("id-ID", {
	dateStyle: "medium",
	timeStyle: "short",
});

export const Route = createFileRoute("/_authenticated/doctor/records")({
	beforeLoad: ({ context }) => {
		const { user } = context;

		if (user.role !== "DOCTOR") {
			throw redirect({ to: roleHomePath[user.role] });
		}
	},
	component: DoctorMedicalRecordsPage,
});

function DoctorMedicalRecordsPage() {
	const recordsQuery = useQuery({
		...doctorMedicalRecordQueries.list(),
		enabled: typeof window !== "undefined",
	});
	const appointmentsQuery = useQuery({
		...doctorAppointmentQueries.list({ status: "SELESAI" }),
		enabled: typeof window !== "undefined",
	});
	const createRecordMutation = useCreateMedicalRecordMutation();
	const [selectedRecordId, setSelectedRecordId] = useState<number | null>(null);
	const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
	const [formValues, setFormValues] = useState<MedicalRecordFormValues>(
		emptyRecordFormValues,
	);
	const [formError, setFormError] = useState("");

	const selectedRecordQuery = useQuery({
		...doctorMedicalRecordQueries.detail(selectedRecordId ?? 0),
		enabled: typeof window !== "undefined" && selectedRecordId !== null,
	});
	const completedAppointmentsWithoutRecords = useMemo(() => {
		const recordedAppointmentIds = new Set(
			(recordsQuery.data ?? []).map((record) => record.appointmentId),
		);

		return (appointmentsQuery.data ?? [])
			.filter((appointment) => !recordedAppointmentIds.has(appointment.id))
			.sort(compareAppointmentsDesc);
	}, [appointmentsQuery.data, recordsQuery.data]);
	const columns = useMemo(
		() =>
			getRecordColumns({
				onView: (record) => setSelectedRecordId(record.id),
			}),
		[],
	);
	const recordsTable = useReactTable({
		columns,
		data: recordsQuery.data ?? [],
		getCoreRowModel: getCoreRowModel(),
	});
	const selectedRecord =
		selectedRecordQuery.data ??
		(recordsQuery.data ?? []).find((record) => record.id === selectedRecordId) ??
		null;
	const isLoading = recordsQuery.isPending || appointmentsQuery.isPending;

	function openCreateDialog() {
		setFormValues({
			...emptyRecordFormValues,
			appointmentId:
				completedAppointmentsWithoutRecords[0]?.id.toString() ?? "",
		});
		setFormError("");
		setIsCreateDialogOpen(true);
	}

	async function handleCreateRecord(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		setFormError("");

		const request = recordRequestFromForm(formValues);

		if (!request) {
			setFormError("Pilih appointment selesai dan isi diagnosis.");
			return;
		}

		try {
			await createRecordMutation.mutateAsync(request);
			setIsCreateDialogOpen(false);
			setFormValues(emptyRecordFormValues);
		} catch (error) {
			setFormError(
				await getMedicalRecordErrorMessage(
					error,
					"Rekam medis gagal dibuat. Periksa data lalu coba lagi.",
				),
			);
		}
	}

	return (
		<main className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-6 py-10">
			<section className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
				<div className="space-y-2">
					<p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
						Dokter
					</p>
					<h1 className="text-3xl font-semibold tracking-normal">
						Rekam Medis
					</h1>
					<p className="max-w-2xl text-sm text-muted-foreground">
						Lihat rekam medis pasien dan buat catatan dari appointment yang
						sudah selesai.
					</p>
				</div>
				<Button
					type="button"
					size="lg"
					onClick={openCreateDialog}
					disabled={
						isLoading || completedAppointmentsWithoutRecords.length === 0
					}
				>
					<Plus className="size-4" />
					Buat Rekam Medis
				</Button>
			</section>

			{isLoading ? <RecordTableSkeleton /> : null}

			{recordsQuery.isError || appointmentsQuery.isError ? (
				<Alert variant="destructive">
					<AlertCircle className="size-4" />
					<AlertDescription>
						Data rekam medis gagal dimuat. Coba muat ulang halaman.
					</AlertDescription>
				</Alert>
			) : null}

			{recordsQuery.isSuccess ? (
				recordsTable.getRowModel().rows.length > 0 ? (
					<Table className="text-sm">
						<TableHeader>
							{recordsTable.getHeaderGroups().map((headerGroup) => (
								<TableRow key={headerGroup.id}>
									{headerGroup.headers.map((header) => (
										<TableHead key={header.id} className="h-12 px-4">
											{header.isPlaceholder
												? null
												: flexRender(
														header.column.columnDef.header,
														header.getContext(),
													)}
										</TableHead>
									))}
								</TableRow>
							))}
						</TableHeader>
						<TableBody>
							{recordsTable.getRowModel().rows.map((row) => (
								<TableRow key={row.id}>
									{row.getVisibleCells().map((cell) => (
										<TableCell
											key={cell.id}
											className={
												cell.column.id === "patientName"
													? "px-4 py-3 font-medium"
													: "px-4 py-3"
											}
										>
											{flexRender(
												cell.column.columnDef.cell,
												cell.getContext(),
											)}
										</TableCell>
									))}
								</TableRow>
							))}
						</TableBody>
					</Table>
				) : (
					<div className="rounded-lg border border-dashed p-8 text-center">
						<ClipboardPlus className="mx-auto size-8 text-muted-foreground" />
						<p className="mt-3 font-medium">Belum ada rekam medis.</p>
						<p className="mt-1 text-sm text-muted-foreground">
							Buat rekam medis dari appointment yang sudah selesai.
						</p>
					</div>
				)
			) : null}

			<CreateRecordDialog
				open={isCreateDialogOpen}
				onOpenChange={(open) => {
					setIsCreateDialogOpen(open);

					if (!open && !createRecordMutation.isPending) {
						setFormError("");
					}
				}}
				appointments={completedAppointmentsWithoutRecords}
				values={formValues}
				error={formError}
				isPending={createRecordMutation.isPending}
				onValuesChange={setFormValues}
				onSubmit={handleCreateRecord}
			/>

			<RecordDetailDialog
				open={selectedRecordId !== null}
				onOpenChange={(open) => {
					if (!open) {
						setSelectedRecordId(null);
					}
				}}
				record={selectedRecord}
				isPending={selectedRecordQuery.isPending}
				isError={selectedRecordQuery.isError}
			/>
		</main>
	);
}

type RecordColumnsOptions = {
	onView: (record: MedicalRecord) => void;
};

function getRecordColumns({
	onView,
}: RecordColumnsOptions): ColumnDef<MedicalRecord>[] {
	return [
		{
			accessorKey: "patientName",
			header: "Pasien",
		},
		{
			accessorKey: "appointmentId",
			header: "Appointment",
			cell: ({ getValue }) => `#${getValue<number>()}`,
		},
		{
			accessorKey: "diagnosis",
			header: "Diagnosis",
			cell: ({ getValue }) => (
				<span className="line-clamp-1 whitespace-normal">
					{getValue<string>()}
				</span>
			),
		},
		{
			accessorKey: "createdAt",
			header: "Dibuat",
			cell: ({ getValue }) =>
				recordDateFormatter.format(new Date(getValue<string>())),
		},
		{
			id: "actions",
			header: () => <span className="sr-only">Aksi</span>,
			cell: ({ row }) => (
				<Button
					type="button"
					variant="ghost"
					size="sm"
					onClick={() => onView(row.original)}
				>
					<Eye className="size-4" />
					Lihat
				</Button>
			),
		},
	];
}

type CreateRecordDialogProps = {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	appointments: Appointment[];
	values: MedicalRecordFormValues;
	error: string;
	isPending: boolean;
	onValuesChange: (values: MedicalRecordFormValues) => void;
	onSubmit: (event: FormEvent<HTMLFormElement>) => void;
};

function CreateRecordDialog({
	open,
	onOpenChange,
	appointments,
	values,
	error,
	isPending,
	onValuesChange,
	onSubmit,
}: CreateRecordDialogProps) {
	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-2xl">
				<DialogHeader>
					<DialogTitle>Buat Rekam Medis</DialogTitle>
					<DialogDescription>
						Rekam medis akan terhubung ke appointment, pasien, dan dokter yang
						bertugas.
					</DialogDescription>
				</DialogHeader>

				<form className="space-y-4" onSubmit={onSubmit}>
					{error ? (
						<Alert variant="destructive">
							<AlertCircle className="size-4" />
							<AlertDescription>{error}</AlertDescription>
						</Alert>
					) : null}

					<div className="grid gap-2">
						<Label htmlFor="appointmentId">Appointment selesai</Label>
						<select
							id="appointmentId"
							className="h-9 w-full rounded-md border border-input bg-input/20 px-2 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30 disabled:cursor-not-allowed disabled:opacity-50"
							value={values.appointmentId}
							disabled={isPending || appointments.length === 0}
							onChange={(event) =>
								onValuesChange({
									...values,
									appointmentId: event.target.value,
								})
							}
						>
							{appointments.length === 0 ? (
								<option value="">Tidak ada appointment tersedia</option>
							) : null}
							{appointments.map((appointment) => (
								<option key={appointment.id} value={appointment.id}>
									{appointmentOptionLabel(appointment)}
								</option>
							))}
						</select>
					</div>

					<div className="grid gap-2">
						<Label htmlFor="symptoms">Keluhan</Label>
						<Textarea
							id="symptoms"
							value={values.symptoms}
							disabled={isPending}
							onChange={(event) =>
								onValuesChange({
									...values,
									symptoms: event.target.value,
								})
							}
						/>
					</div>

					<div className="grid gap-2">
						<Label htmlFor="diagnosis">Diagnosis</Label>
						<Input
							id="diagnosis"
							value={values.diagnosis}
							disabled={isPending}
							onChange={(event) =>
								onValuesChange({
									...values,
									diagnosis: event.target.value,
								})
							}
						/>
					</div>

					<div className="grid gap-2">
						<Label htmlFor="treatmentNotes">Tindakan / Catatan Medis</Label>
						<Textarea
							id="treatmentNotes"
							value={values.treatmentNotes}
							disabled={isPending}
							onChange={(event) =>
								onValuesChange({
									...values,
									treatmentNotes: event.target.value,
								})
							}
						/>
					</div>

					<DialogFooter className="-mx-4 border-t px-4 pt-4">
						<Button
							type="button"
							variant="outline"
							disabled={isPending}
							onClick={() => onOpenChange(false)}
						>
							Batal
						</Button>
						<Button
							type="submit"
							disabled={isPending || appointments.length === 0}
						>
							<FileText className="size-4" />
							{isPending ? "Menyimpan..." : "Simpan Rekam Medis"}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}

type RecordDetailDialogProps = {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	record: MedicalRecord | null;
	isPending: boolean;
	isError: boolean;
};

function RecordDetailDialog({
	open,
	onOpenChange,
	record,
	isPending,
	isError,
}: RecordDetailDialogProps) {
	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-2xl">
				<DialogHeader>
					<DialogTitle>Detail Rekam Medis</DialogTitle>
					<DialogDescription>
						Data pemeriksaan pasien dari appointment yang sudah selesai.
					</DialogDescription>
				</DialogHeader>

				{isPending ? (
					<div className="space-y-3">
						<Skeleton className="h-5 w-1/2" />
						<Skeleton className="h-20 w-full" />
						<Skeleton className="h-20 w-full" />
					</div>
				) : null}

				{isError ? (
					<Alert variant="destructive">
						<AlertCircle className="size-4" />
						<AlertDescription>
							Detail rekam medis gagal dimuat. Coba lagi.
						</AlertDescription>
					</Alert>
				) : null}

				{record ? <RecordDetailContent record={record} /> : null}
			</DialogContent>
		</Dialog>
	);
}

function RecordDetailContent({ record }: { record: MedicalRecord }) {
	return (
		<div className="space-y-5">
			<div className="grid gap-3 rounded-lg border bg-muted/20 p-4 sm:grid-cols-2">
				<DetailItem label="Pasien" value={record.patientName} />
				<DetailItem label="Appointment" value={`#${record.appointmentId}`} />
				<DetailItem label="Dokter" value={record.doctorName} />
				<DetailItem
					label="Dibuat"
					value={recordDateFormatter.format(new Date(record.createdAt))}
				/>
			</div>

			<div className="grid gap-4">
				<DetailSection label="Keluhan" value={record.symptoms} />
				<DetailSection label="Diagnosis" value={record.diagnosis} />
				<DetailSection
					label="Tindakan / Catatan Medis"
					value={record.treatmentNotes}
				/>
			</div>
		</div>
	);
}

function DetailItem({ label, value }: { label: string; value: string }) {
	return (
		<div className="space-y-1">
			<p className="text-xs font-medium text-muted-foreground">{label}</p>
			<p className="text-sm font-medium">{value}</p>
		</div>
	);
}

function DetailSection({
	label,
	value,
}: {
	label: string;
	value: string | null;
}) {
	return (
		<section className="space-y-2">
			<h2 className="text-sm font-semibold">{label}</h2>
			<p className="min-h-16 whitespace-pre-wrap rounded-lg border bg-muted/20 p-3 text-sm text-muted-foreground">
				{value?.trim() ? value : "-"}
			</p>
		</section>
	);
}

function RecordTableSkeleton() {
	return (
		<div className="space-y-3">
			<Skeleton className="h-11 w-full" />
			<Skeleton className="h-11 w-full" />
			<Skeleton className="h-11 w-full" />
		</div>
	);
}

function recordRequestFromForm(
	values: MedicalRecordFormValues,
): MedicalRecordRequest | null {
	const appointmentId = Number(values.appointmentId);
	const diagnosis = values.diagnosis.trim();

	if (!Number.isFinite(appointmentId) || appointmentId <= 0 || !diagnosis) {
		return null;
	}

	return {
		appointmentId,
		diagnosis,
		symptoms: optionalText(values.symptoms),
		treatmentNotes: optionalText(values.treatmentNotes),
	};
}

function optionalText(value: string) {
	const trimmed = value.trim();

	return trimmed.length > 0 ? trimmed : undefined;
}

function compareAppointmentsDesc(left: Appointment, right: Appointment) {
	return dateValue(right.startsAt ?? right.bookedAt) -
		dateValue(left.startsAt ?? left.bookedAt);
}

function dateValue(value: string | null) {
	return value ? new Date(value).getTime() : 0;
}

function appointmentOptionLabel(appointment: Appointment) {
	const date = appointment.startsAt
		? recordDateFormatter.format(new Date(appointment.startsAt))
		: "Tanpa jadwal";

	return `#${appointment.id} - ${appointment.patientName} - ${date}`;
}

async function getMedicalRecordErrorMessage(error: unknown, fallback: string) {
	if (!(error instanceof ApiError)) {
		return fallback;
	}

	const apiMessage = await getApiErrorMessage(error);

	if (apiMessage?.toLowerCase().includes("completed")) {
		return "Rekam medis hanya bisa dibuat dari appointment yang sudah selesai.";
	}

	if (apiMessage?.toLowerCase().includes("already has")) {
		return "Appointment ini sudah memiliki rekam medis.";
	}

	return apiMessage ?? fallback;
}

async function getApiErrorMessage(error: ApiError) {
	try {
		const data = (await error.response.clone().json()) as ApiErrorResponse;

		return typeof data.message === "string" ? data.message : null;
	} catch {
		return null;
	}
}
