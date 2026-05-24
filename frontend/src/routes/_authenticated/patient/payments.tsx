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
	CheckCircle2,
	CircleDollarSign,
	CreditCard,
	Eye,
	XCircle,
} from "lucide-react";
import { useMemo, useState } from "react";

import { patientPaymentQueries } from "@/api/patient/payments/queries";
import type {
	Payment,
	PaymentStatus,
} from "@/api/patient/payments/types";
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
import { cn } from "@/lib/utils";

const paymentStatusLabels: Record<PaymentStatus, string> = {
	BELUM_BAYAR: "Belum Bayar",
	LUNAS: "Lunas",
	DIBATALKAN: "Dibatalkan",
};

const paymentStatusClasses: Record<PaymentStatus, string> = {
	BELUM_BAYAR: "border-amber-200 bg-amber-50 text-amber-700",
	LUNAS: "border-emerald-200 bg-emerald-50 text-emerald-700",
	DIBATALKAN: "border-rose-200 bg-rose-50 text-rose-700",
};

const paymentDateFormatter = new Intl.DateTimeFormat("id-ID", {
	dateStyle: "medium",
	timeStyle: "short",
});

const currencyFormatter = new Intl.NumberFormat("id-ID", {
	style: "currency",
	currency: "IDR",
	maximumFractionDigits: 0,
});

export const Route = createFileRoute("/_authenticated/patient/payments")({
	beforeLoad: ({ context }) => {
		const { user } = context;

		if (user.role !== "PATIENT") {
			throw redirect({ to: roleHomePath[user.role] });
		}
	},
	component: PatientPaymentsPage,
});

function PatientPaymentsPage() {
	const paymentsQuery = useQuery({
		...patientPaymentQueries.list(),
		enabled: typeof window !== "undefined",
	});
	const [selectedPaymentId, setSelectedPaymentId] = useState<number | null>(
		null,
	);
	const selectedPaymentQuery = useQuery({
		...patientPaymentQueries.detail(selectedPaymentId ?? 0),
		enabled: typeof window !== "undefined" && selectedPaymentId !== null,
	});
	const payments = useMemo(
		() => (paymentsQuery.data ?? []).slice().sort(comparePaymentsDesc),
		[paymentsQuery.data],
	);
	const summary = useMemo(() => getPaymentSummary(payments), [payments]);
	const columns = useMemo(
		() =>
			getPaymentColumns({
				onView: (payment) => setSelectedPaymentId(payment.id),
			}),
		[],
	);
	const paymentsTable = useReactTable({
		columns,
		data: payments,
		getCoreRowModel: getCoreRowModel(),
	});
	const selectedPayment =
		selectedPaymentQuery.data ??
		payments.find((payment) => payment.id === selectedPaymentId) ??
		null;

	return (
		<main className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-6 py-10">
			<section className="space-y-2">
				<p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
					Pasien
				</p>
				<h1 className="text-3xl font-semibold tracking-normal">
					Pembayaran Saya
				</h1>
				<p className="max-w-2xl text-sm text-muted-foreground">
					Lihat status tagihan konsultasi dan riwayat pembayaran appointment.
				</p>
			</section>

			<section className="grid gap-3 md:grid-cols-3">
				<SummaryItem
					label="Belum Bayar"
					value={`${summary.unpaidTotalLabel} / ${summary.unpaidCount} tagihan`}
					icon={CircleDollarSign}
				/>
				<SummaryItem
					label="Lunas"
					value={`${summary.paidCount} tagihan`}
					icon={CheckCircle2}
				/>
				<SummaryItem
					label="Dibatalkan"
					value={`${summary.cancelledCount} tagihan`}
					icon={XCircle}
				/>
			</section>

			{paymentsQuery.isPending ? <PaymentTableSkeleton /> : null}

			{paymentsQuery.isError ? (
				<Alert variant="destructive">
					<AlertCircle className="size-4" />
					<AlertDescription>
						Data pembayaran gagal dimuat. Coba muat ulang halaman.
					</AlertDescription>
				</Alert>
			) : null}

			{paymentsQuery.isSuccess ? (
				paymentsTable.getRowModel().rows.length > 0 ? (
					<div className="overflow-hidden rounded-lg border">
						<Table className="text-sm">
							<TableHeader>
								{paymentsTable.getHeaderGroups().map((headerGroup) => (
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
								{paymentsTable.getRowModel().rows.map((row) => (
									<TableRow
										key={row.id}
										className="cursor-pointer"
										onClick={() => setSelectedPaymentId(row.original.id)}
									>
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
					</div>
				) : (
					<div className="rounded-lg border border-dashed p-8 text-center">
						<CreditCard className="mx-auto size-8 text-muted-foreground" />
						<p className="mt-3 font-medium">Belum ada pembayaran.</p>
						<p className="mt-1 text-sm text-muted-foreground">
							Tagihan konsultasi akan muncul setelah admin membuat pembayaran.
						</p>
					</div>
				)
			) : null}

			<PaymentDetailDialog
				open={selectedPaymentId !== null}
				onOpenChange={(open) => {
					if (!open) {
						setSelectedPaymentId(null);
					}
				}}
				payment={selectedPayment}
				isPending={selectedPaymentQuery.isPending}
				isError={selectedPaymentQuery.isError}
			/>
		</main>
	);
}

type PaymentColumnsOptions = {
	onView: (payment: Payment) => void;
};

function getPaymentColumns({
	onView,
}: PaymentColumnsOptions): ColumnDef<Payment>[] {
	return [
		{
			accessorKey: "doctorName",
			header: "Dokter",
		},
		{
			id: "appointment",
			header: "Appointment",
			cell: ({ row }) => (
				<div className="space-y-1">
					<p className="font-medium">#{row.original.appointmentId}</p>
					<p className="text-xs text-muted-foreground">
						{formatOptionalDate(row.original.appointmentDate)}
					</p>
				</div>
			),
		},
		{
			accessorKey: "amount",
			header: "Nominal",
			cell: ({ getValue }) => formatCurrency(getValue<number>()),
		},
		{
			id: "method",
			header: "Metode",
			cell: ({ row }) => row.original.methodDisplayName,
		},
		{
			accessorKey: "status",
			header: "Status",
			cell: ({ getValue }) => (
				<PaymentStatusBadge status={getValue<PaymentStatus>()} />
			),
		},
		{
			accessorKey: "paidAt",
			header: "Dibayar",
			cell: ({ getValue }) => formatOptionalDate(getValue<string | null>()),
		},
		{
			accessorKey: "createdAt",
			header: "Dibuat",
			cell: ({ getValue }) => formatOptionalDate(getValue<string>()),
		},
		{
			id: "actions",
			header: () => <span className="sr-only">Aksi</span>,
			cell: ({ row }) => (
				<Button
					type="button"
					variant="ghost"
					size="sm"
					onClick={(event) => {
						event.stopPropagation();
						onView(row.original);
					}}
				>
					<Eye className="size-4" />
					Lihat
				</Button>
			),
		},
	];
}

type PaymentDetailDialogProps = {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	payment: Payment | null;
	isPending: boolean;
	isError: boolean;
};

function PaymentDetailDialog({
	open,
	onOpenChange,
	payment,
	isPending,
	isError,
}: PaymentDetailDialogProps) {
	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-2xl">
				<DialogHeader>
					<DialogTitle>Detail Pembayaran</DialogTitle>
					<DialogDescription>
						Informasi tagihan dan status pembayaran konsultasi.
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
							Detail pembayaran gagal dimuat. Coba lagi.
						</AlertDescription>
					</Alert>
				) : null}

				{payment ? <PaymentDetailContent payment={payment} /> : null}
			</DialogContent>
		</Dialog>
	);
}

function PaymentDetailContent({ payment }: { payment: Payment }) {
	return (
		<div className="space-y-5">
			<div className="grid gap-3 rounded-lg border bg-muted/20 p-4 sm:grid-cols-2">
				<DetailItem label="Dokter" value={payment.doctorName} />
				<DetailItem label="Appointment" value={`#${payment.appointmentId}`} />
				<DetailItem
					label="Tanggal Appointment"
					value={formatOptionalDate(payment.appointmentDate)}
				/>
				<DetailItem label="Nominal" value={formatCurrency(payment.amount)} />
				<DetailItem
					label="Status"
					value={paymentStatusLabels[payment.status]}
				/>
				<DetailItem label="Metode" value={payment.methodDisplayName} />
				<DetailItem
					label="Nomor Referensi"
					value={payment.referenceNumber?.trim() || "-"}
				/>
				<DetailItem label="Dibayar" value={formatOptionalDate(payment.paidAt)} />
				<DetailItem label="Dibuat" value={formatOptionalDate(payment.createdAt)} />
				<DetailItem
					label="Diperbarui"
					value={formatOptionalDate(payment.updatedAt)}
				/>
			</div>
		</div>
	);
}

type SummaryItemProps = {
	label: string;
	value: string;
	icon: React.ComponentType<{ className?: string }>;
};

function SummaryItem({ label, value, icon: Icon }: SummaryItemProps) {
	return (
		<div className="flex items-center gap-3 rounded-lg border bg-muted/20 p-4">
			<div className="flex size-9 items-center justify-center rounded-md bg-background">
				<Icon className="size-4 text-muted-foreground" />
			</div>
			<div className="min-w-0">
				<p className="text-xs font-medium text-muted-foreground">{label}</p>
				<p className="truncate text-lg font-semibold">{value}</p>
			</div>
		</div>
	);
}

function PaymentStatusBadge({ status }: { status: PaymentStatus }) {
	return (
		<span
			className={cn(
				"inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium",
				paymentStatusClasses[status],
			)}
		>
			{paymentStatusLabels[status]}
		</span>
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

function PaymentTableSkeleton() {
	return (
		<div className="space-y-3">
			<Skeleton className="h-11 w-full" />
			<Skeleton className="h-11 w-full" />
			<Skeleton className="h-11 w-full" />
			<Skeleton className="h-11 w-full" />
		</div>
	);
}

function getPaymentSummary(payments: Payment[]) {
	const unpaidPayments = payments.filter(
		(payment) => payment.status === "BELUM_BAYAR",
	);
	const unpaidTotal = unpaidPayments.reduce(
		(sum, payment) => sum + payment.amount,
		0,
	);

	return {
		unpaidTotalLabel: formatCurrency(unpaidTotal),
		unpaidCount: unpaidPayments.length,
		paidCount: payments.filter((payment) => payment.status === "LUNAS").length,
		cancelledCount: payments.filter(
			(payment) => payment.status === "DIBATALKAN",
		).length,
	};
}

function formatCurrency(value: number) {
	return currencyFormatter.format(value);
}

function formatOptionalDate(value: string | null) {
	if (!value) {
		return "-";
	}

	return paymentDateFormatter.format(new Date(value));
}

function comparePaymentsDesc(left: Payment, right: Payment) {
	return new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime();
}
