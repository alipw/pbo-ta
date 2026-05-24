import { useQuery } from "@tanstack/react-query";
import { createFileRoute, redirect } from "@tanstack/react-router";
import {
	type ColumnDef,
	flexRender,
	getCoreRowModel,
	useReactTable,
} from "@tanstack/react-table";
import { AlertCircle, ClipboardList, Eye } from "lucide-react";
import { useMemo, useState } from "react";

import { patientMedicalRecordQueries } from "@/api/patient/records/queries";
import type { MedicalRecord } from "@/api/patient/records/types";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { roleHomePath } from "@/lib/auth";

const recordDateFormatter = new Intl.DateTimeFormat("id-ID", {
	dateStyle: "medium",
	timeStyle: "short",
});

export const Route = createFileRoute("/_authenticated/patient/records")({
	beforeLoad: ({ context }) => {
		const { user } = context;

		if (user.role !== "PATIENT") {
			throw redirect({ to: roleHomePath[user.role] });
		}
	},
	component: PatientMedicalRecordsPage,
});

function PatientMedicalRecordsPage() {
	const recordsQuery = useQuery({
		...patientMedicalRecordQueries.list(),
		enabled: typeof window !== "undefined",
	});
	const [selectedRecordId, setSelectedRecordId] = useState<number | null>(null);
	const selectedRecordQuery = useQuery({
		...patientMedicalRecordQueries.detail(selectedRecordId ?? 0),
		enabled: typeof window !== "undefined" && selectedRecordId !== null,
	});
	const records = useMemo(
		() => (recordsQuery.data ?? []).slice().sort(compareRecordsDesc),
		[recordsQuery.data],
	);
	const columns = useMemo(
		() =>
			getRecordColumns({
				onView: (record) => setSelectedRecordId(record.id),
			}),
		[],
	);
	const recordsTable = useReactTable({
		columns,
		data: records,
		getCoreRowModel: getCoreRowModel(),
	});
	const selectedRecord =
		selectedRecordQuery.data ??
		records.find((record) => record.id === selectedRecordId) ??
		null;

	return (
		<main className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-6 py-10">
			<section className="space-y-2">
				<p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
					Pasien
				</p>
				<h1 className="text-3xl font-semibold tracking-normal">Rekam Medis</h1>
				<p className="max-w-2xl text-sm text-muted-foreground">
					Lihat riwayat hasil konsultasi yang sudah dicatat oleh dokter.
				</p>
			</section>

			{recordsQuery.isPending ? <RecordTableSkeleton /> : null}

			{recordsQuery.isError ? (
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
												cell.column.id === "doctorName"
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
						<ClipboardList className="mx-auto size-8 text-muted-foreground" />
						<p className="mt-3 font-medium">Belum ada rekam medis.</p>
						<p className="mt-1 text-sm text-muted-foreground">
							Rekam medis akan muncul setelah dokter mencatat hasil konsultasi.
						</p>
					</div>
				)
			) : null}

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
			accessorKey: "doctorName",
			header: "Dokter",
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
						Riwayat hasil pemeriksaan dari appointment yang sudah selesai.
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
				<DetailItem label="Dokter" value={record.doctorName} />
				<DetailItem label="Appointment" value={`#${record.appointmentId}`} />
				<DetailItem label="Pasien" value={record.patientName} />
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

function compareRecordsDesc(left: MedicalRecord, right: MedicalRecord) {
	return new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime();
}
