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
	Banknote,
	CheckCircle2,
	CircleDollarSign,
	CreditCard,
	Eye,
	Plus,
	ReceiptText,
	XCircle,
} from "lucide-react";
import type { FormEvent } from "react";
import { useCallback, useMemo, useRef, useState } from "react";

import { adminAppointmentQueries } from "@/api/admin/appointments/queries";
import type { Appointment } from "@/api/admin/appointments/types";
import {
	useCreatePaymentMutation,
	useUpdatePaymentStatusMutation,
} from "@/api/admin/payments/mutations";
import { adminPaymentQueries } from "@/api/admin/payments/queries";
import type {
	Payment,
	PaymentMethodType,
	PaymentStatus,
} from "@/api/admin/payments/types";
import { ApiError } from "@/api/client";
import { AdminFormDialog } from "@/components/admin/admin-dialogs";
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
import { roleHomePath } from "@/lib/auth";
import { cn } from "@/lib/utils";

type PaymentFormValues = {
	appointmentId: string;
	amount: string;
	methodType: PaymentMethodType;
	referenceNumber: string;
};

type PaymentStatusFormValues = {
	status: PaymentStatus;
	methodType: PaymentMethodType;
	referenceNumber: string;
	paidAt: string;
};

type ApiErrorResponse = {
	message?: unknown;
};

const paymentStatuses = ["BELUM_BAYAR", "LUNAS", "DIBATALKAN"] as const;

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

const paymentMethods = ["CASH", "TRANSFER", "EWALLET"] as const;

const paymentMethodLabels: Record<PaymentMethodType, string> = {
	CASH: "Cash",
	TRANSFER: "Transfer",
	EWALLET: "E-Wallet",
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

export const Route = createFileRoute("/_authenticated/admin/payments")({
	beforeLoad: ({ context }) => {
		const { user } = context;

		if (user.role !== "ADMIN") {
			throw redirect({ to: roleHomePath[user.role] });
		}
	},
	component: AdminPaymentsPage,
});

function AdminPaymentsPage() {
	const paymentsQuery = useQuery({
		...adminPaymentQueries.list(),
		enabled: typeof window !== "undefined",
	});
	const appointmentsQuery = useQuery({
		...adminAppointmentQueries.list(),
		enabled: typeof window !== "undefined",
	});
	const [selectedPaymentId, setSelectedPaymentId] = useState<number | null>(
		null,
	);
	const selectedPaymentQuery = useQuery({
		...adminPaymentQueries.detail(selectedPaymentId ?? 0),
		enabled: typeof window !== "undefined" && selectedPaymentId !== null,
	});
	const createPaymentMutation = useCreatePaymentMutation();
	const updatePaymentStatusMutation = useUpdatePaymentStatusMutation();
	const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
	const [statusPayment, setStatusPayment] = useState<Payment | null>(null);
	const [paymentFormValues, setPaymentFormValues] =
		useState<PaymentFormValues>(() => defaultPaymentFormValues());
	const [statusFormValues, setStatusFormValues] =
		useState<PaymentStatusFormValues>(() => defaultPaymentStatusFormValues());
	const [formError, setFormError] = useState("");
	const [statusError, setStatusError] = useState("");
	const openStatusDialog = useCallback((payment: Payment) => {
		setStatusPayment(payment);
		setStatusFormValues(paymentToStatusFormValues(payment));
		setStatusError("");
	}, []);

	const payments = useMemo(
		() => (paymentsQuery.data ?? []).slice().sort(comparePaymentsDesc),
		[paymentsQuery.data],
	);
	const billableAppointments = useMemo(
		() =>
			getBillableAppointments(
				appointmentsQuery.data ?? [],
				paymentsQuery.data ?? [],
			),
		[appointmentsQuery.data, paymentsQuery.data],
	);
	const appointmentOptions = useMemo(
		() =>
			billableAppointments.map((appointment) => ({
				value: String(appointment.id),
				label: appointmentOptionLabel(appointment),
			})),
		[billableAppointments],
	);
	const selectedPayment =
		selectedPaymentQuery.data ??
		payments.find((payment) => payment.id === selectedPaymentId) ??
		null;
	const summary = useMemo(() => getPaymentSummary(payments), [payments]);
	const columns = useMemo(
		() =>
			getPaymentColumns({
				onView: (payment) => setSelectedPaymentId(payment.id),
				onUpdateStatus: openStatusDialog,
			}),
		[openStatusDialog],
	);
	const paymentsTable = useReactTable({
		columns,
		data: payments,
		getCoreRowModel: getCoreRowModel(),
	});
	const isCreatingPayment = createPaymentMutation.isPending;
	const isUpdatingStatus = updatePaymentStatusMutation.isPending;

	function openCreateDialog() {
		setPaymentFormValues(defaultPaymentFormValues());
		setFormError("");
		setIsCreateDialogOpen(true);
	}

	async function handlePaymentSubmit(event: FormEvent) {
		event.preventDefault();
		setFormError("");

		const request = paymentRequestFromForm(paymentFormValues);

		if (!request) {
			setFormError("Pilih appointment valid dan isi nominal pembayaran.");
			return;
		}

		try {
			await createPaymentMutation.mutateAsync(request);
			setPaymentFormValues(defaultPaymentFormValues());
			setIsCreateDialogOpen(false);
		} catch (error) {
			setFormError(
				await getApiErrorMessage(
					error,
					"Tagihan gagal dibuat. Periksa data lalu coba lagi.",
				),
			);
		}
	}

	async function handleStatusSubmit(event: FormEvent) {
		event.preventDefault();

		if (!statusPayment) {
			return;
		}

		setStatusError("");

		try {
			await updatePaymentStatusMutation.mutateAsync({
				paymentId: statusPayment.id,
				request: paymentStatusRequestFromForm(statusFormValues),
			});
			setStatusPayment(null);
		} catch (error) {
			setStatusError(
				await getApiErrorMessage(
					error,
					"Status pembayaran gagal diperbarui. Coba lagi.",
				),
			);
		}
	}

	return (
		<main className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-6 py-10">
			<section className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
				<div className="space-y-2">
					<p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
						Admin
					</p>
					<h1 className="text-3xl font-semibold tracking-normal">
						Pembayaran
					</h1>
					<p className="max-w-2xl text-sm text-muted-foreground">
						Kelola tagihan konsultasi internal klinik dan verifikasi status
						pembayaran pasien.
					</p>
				</div>
				<Button
					type="button"
					className="w-fit"
					disabled={appointmentsQuery.isPending}
					onClick={openCreateDialog}
				>
					<Plus className="size-4" />
					Buat Tagihan
				</Button>
			</section>

			<section className="grid gap-3 md:grid-cols-4">
				<SummaryItem
					label="Total Tagihan"
					value={summary.totalLabel}
					icon={ReceiptText}
				/>
				<SummaryItem
					label="Belum Bayar"
					value={String(summary.unpaidCount)}
					icon={CircleDollarSign}
				/>
				<SummaryItem
					label="Lunas"
					value={String(summary.paidCount)}
					icon={CheckCircle2}
				/>
				<SummaryItem
					label="Dibatalkan"
					value={String(summary.cancelledCount)}
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
					</div>
				) : (
					<div className="rounded-lg border border-dashed p-8 text-center">
						<CreditCard className="mx-auto size-8 text-muted-foreground" />
						<p className="mt-3 font-medium">Belum ada pembayaran.</p>
						<p className="mt-1 text-sm text-muted-foreground">
							Buat tagihan dari appointment yang sudah disetujui atau selesai.
						</p>
					</div>
				)
			) : null}

			<CreatePaymentDialog
				open={isCreateDialogOpen}
				onOpenChange={setIsCreateDialogOpen}
				values={paymentFormValues}
				appointmentOptions={appointmentOptions}
				isAppointmentLoading={appointmentsQuery.isPending}
				error={formError}
				isPending={isCreatingPayment}
				onChange={(values) =>
					setPaymentFormValues((current) => ({ ...current, ...values }))
				}
				onSubmit={handlePaymentSubmit}
			/>
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
			<PaymentStatusDialog
				open={statusPayment !== null}
				onOpenChange={(open) => {
					if (!open) {
						setStatusPayment(null);
					}
				}}
				payment={statusPayment}
				values={statusFormValues}
				error={statusError}
				isPending={isUpdatingStatus}
				onChange={(values) =>
					setStatusFormValues((current) => ({ ...current, ...values }))
				}
				onSubmit={handleStatusSubmit}
			/>
		</main>
	);
}

type PaymentColumnsOptions = {
	onView: (payment: Payment) => void;
	onUpdateStatus: (payment: Payment) => void;
};

function getPaymentColumns({
	onView,
	onUpdateStatus,
}: PaymentColumnsOptions): ColumnDef<Payment>[] {
	return [
		{
			accessorKey: "patientName",
			header: "Pasien",
		},
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
			cell: ({ getValue }) =>
				paymentDateFormatter.format(new Date(getValue<string>())),
		},
		{
			id: "actions",
			header: () => <span className="sr-only">Aksi</span>,
			cell: ({ row }) => (
				<div className="flex justify-end gap-1">
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
					<Button
						type="button"
						variant="ghost"
						size="sm"
						onClick={(event) => {
							event.stopPropagation();
							onUpdateStatus(row.original);
						}}
					>
						<Banknote className="size-4" />
						Status
					</Button>
				</div>
			),
		},
	];
}

type CreatePaymentDialogProps = {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	values: PaymentFormValues;
	appointmentOptions: ComboboxOption[];
	isAppointmentLoading: boolean;
	error: string;
	isPending: boolean;
	onChange: (values: Partial<PaymentFormValues>) => void;
	onSubmit: (event: FormEvent) => void;
};

function CreatePaymentDialog({
	open,
	onOpenChange,
	values,
	appointmentOptions,
	isAppointmentLoading,
	error,
	isPending,
	onChange,
	onSubmit,
}: CreatePaymentDialogProps) {
	return (
		<AdminFormDialog
			open={open}
			onOpenChange={onOpenChange}
			title="Buat Tagihan"
			description="Tagihan hanya dapat dibuat untuk appointment yang disetujui atau selesai."
			contentClassName="sm:max-w-xl"
		>
			<form className="space-y-5" onSubmit={onSubmit}>
				{error ? (
					<Alert variant="destructive">
						<AlertCircle className="size-4" />
						<AlertDescription>{error}</AlertDescription>
					</Alert>
				) : null}

				<ComboboxField
					id="appointmentId"
					label="Appointment"
					value={values.appointmentId}
					placeholder={
						isAppointmentLoading
							? "Memuat appointment..."
							: "Pilih appointment"
					}
					options={appointmentOptions}
					disabled={isAppointmentLoading || isPending}
					onChange={(appointmentId) => onChange({ appointmentId })}
				/>

				<div className="grid gap-4 sm:grid-cols-2">
					<TextField
						id="amount"
						label="Nominal"
						type="number"
						value={values.amount}
						min="0"
						step="1000"
						disabled={isPending}
						onChange={(amount) => onChange({ amount })}
					/>
					<ComboboxField
						id="methodType"
						label="Metode"
						value={values.methodType}
						placeholder="Pilih metode"
						options={paymentMethods.map((method) => ({
							value: method,
							label: paymentMethodLabels[method],
						}))}
						disabled={isPending}
						onChange={(methodType) =>
							onChange({ methodType: methodType as PaymentMethodType })
						}
					/>
				</div>

				<TextField
					id="referenceNumber"
					label="Nomor Referensi"
					value={values.referenceNumber}
					placeholder="Opsional"
					disabled={isPending}
					onChange={(referenceNumber) => onChange({ referenceNumber })}
				/>

				<DialogFooter className="-mx-4 border-t px-4 pt-4">
					<Button
						type="button"
						variant="outline"
						disabled={isPending}
						onClick={() => onOpenChange(false)}
					>
						Batal
					</Button>
					<Button type="submit" disabled={isPending}>
						{isPending ? "Menyimpan..." : "Simpan"}
					</Button>
				</DialogFooter>
			</form>
		</AdminFormDialog>
	);
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
						Informasi tagihan dan status pembayaran appointment.
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
				<DetailItem label="Pasien" value={payment.patientName} />
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
				<DetailItem
					label="Dibuat"
					value={paymentDateFormatter.format(new Date(payment.createdAt))}
				/>
			</div>
		</div>
	);
}

type PaymentStatusDialogProps = {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	payment: Payment | null;
	values: PaymentStatusFormValues;
	error: string;
	isPending: boolean;
	onChange: (values: Partial<PaymentStatusFormValues>) => void;
	onSubmit: (event: FormEvent) => void;
};

function PaymentStatusDialog({
	open,
	onOpenChange,
	payment,
	values,
	error,
	isPending,
	onChange,
	onSubmit,
}: PaymentStatusDialogProps) {
	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-lg">
				<DialogHeader>
					<DialogTitle>Ubah Status Pembayaran</DialogTitle>
					<DialogDescription>
						{payment
							? `Appointment #${payment.appointmentId} - ${payment.patientName}`
							: "Perbarui status pembayaran."}
					</DialogDescription>
				</DialogHeader>

				<form className="space-y-5" onSubmit={onSubmit}>
					{error ? (
						<Alert variant="destructive">
							<AlertCircle className="size-4" />
							<AlertDescription>{error}</AlertDescription>
						</Alert>
					) : null}

					<ComboboxField
						id="status"
						label="Status"
						value={values.status}
						placeholder="Pilih status"
						options={paymentStatuses.map((status) => ({
							value: status,
							label: paymentStatusLabels[status],
						}))}
						disabled={isPending}
						onChange={(status) => onChange({ status: status as PaymentStatus })}
					/>

					<div className="grid gap-4 sm:grid-cols-2">
						<ComboboxField
							id="statusMethodType"
							label="Metode"
							value={values.methodType}
							placeholder="Pilih metode"
							options={paymentMethods.map((method) => ({
								value: method,
								label: paymentMethodLabels[method],
							}))}
							disabled={isPending}
							onChange={(methodType) =>
								onChange({ methodType: methodType as PaymentMethodType })
							}
						/>
						<TextField
							id="paidAt"
							label="Waktu Dibayar"
							type="datetime-local"
							value={values.paidAt}
							disabled={isPending || values.status !== "LUNAS"}
							onChange={(paidAt) => onChange({ paidAt })}
						/>
					</div>

					<TextField
						id="statusReferenceNumber"
						label="Nomor Referensi"
						value={values.referenceNumber}
						placeholder="Opsional"
						disabled={isPending}
						onChange={(referenceNumber) => onChange({ referenceNumber })}
					/>

					<DialogFooter className="-mx-4 border-t px-4 pt-4">
						<Button
							type="button"
							variant="outline"
							disabled={isPending}
							onClick={() => onOpenChange(false)}
						>
							Batal
						</Button>
						<Button type="submit" disabled={isPending}>
							{isPending ? "Menyimpan..." : "Simpan"}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
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

type ComboboxOption = {
	value: string;
	label: string;
};

type ComboboxFieldProps = {
	id: string;
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
	id: string;
	label: string;
	value: string;
	type?: React.HTMLInputTypeAttribute;
	placeholder?: string;
	min?: string;
	step?: string;
	disabled?: boolean;
	onChange: (value: string) => void;
};

function TextField({
	id,
	label,
	value,
	type = "text",
	placeholder,
	min,
	step,
	disabled,
	onChange,
}: TextFieldProps) {
	return (
		<div className="space-y-2">
			<Label htmlFor={id}>{label}</Label>
			<Input
				id={id}
				type={type}
				value={value}
				placeholder={placeholder}
				min={min}
				step={step}
				disabled={disabled}
				onChange={(event) => onChange(event.target.value)}
			/>
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

function defaultPaymentFormValues(): PaymentFormValues {
	return {
		appointmentId: "",
		amount: "",
		methodType: "CASH",
		referenceNumber: "",
	};
}

function defaultPaymentStatusFormValues(): PaymentStatusFormValues {
	return {
		status: "BELUM_BAYAR",
		methodType: "CASH",
		referenceNumber: "",
		paidAt: "",
	};
}

function paymentToStatusFormValues(payment: Payment): PaymentStatusFormValues {
	return {
		status: payment.status,
		methodType: payment.methodType,
		referenceNumber: payment.referenceNumber ?? "",
		paidAt: toDateTimeLocalValue(payment.paidAt),
	};
}

function paymentRequestFromForm(values: PaymentFormValues) {
	const appointmentId = Number(values.appointmentId);
	const amount = Number(values.amount);

	if (!Number.isFinite(appointmentId) || appointmentId <= 0) {
		return null;
	}

	if (!Number.isFinite(amount) || amount <= 0) {
		return null;
	}

	return {
		appointmentId,
		amount,
		methodType: values.methodType,
		referenceNumber: values.referenceNumber.trim() || undefined,
	};
}

function paymentStatusRequestFromForm(values: PaymentStatusFormValues) {
	const paidAt =
		values.status === "LUNAS" && values.paidAt
			? new Date(values.paidAt).toISOString()
			: undefined;

	return {
		status: values.status,
		methodType: values.methodType,
		referenceNumber: values.referenceNumber.trim() || undefined,
		paidAt,
	};
}

function getBillableAppointments(
	appointments: Appointment[],
	payments: Payment[],
) {
	const billedAppointmentIds = new Set(
		payments.map((payment) => payment.appointmentId),
	);

	return appointments
		.filter(
			(appointment) =>
				(appointment.status === "DISETUJUI" ||
					appointment.status === "SELESAI") &&
				!billedAppointmentIds.has(appointment.id),
		)
		.sort(compareAppointmentsDesc);
}

function appointmentOptionLabel(appointment: Appointment) {
	const date = formatOptionalDate(appointment.startsAt ?? appointment.bookedAt);

	return `#${appointment.id} - ${appointment.patientName} / ${appointment.doctorName} - ${date}`;
}

function getPaymentSummary(payments: Payment[]) {
	const total = payments.reduce((sum, payment) => sum + payment.amount, 0);

	return {
		totalLabel: formatCurrency(total),
		unpaidCount: payments.filter((payment) => payment.status === "BELUM_BAYAR")
			.length,
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
	return value ? paymentDateFormatter.format(new Date(value)) : "-";
}

function toDateTimeLocalValue(value: string | null) {
	if (!value) {
		return "";
	}

	const date = new Date(value);

	if (Number.isNaN(date.getTime())) {
		return "";
	}

	const offsetMs = date.getTimezoneOffset() * 60_000;

	return new Date(date.getTime() - offsetMs).toISOString().slice(0, 16);
}

function comparePaymentsDesc(left: Payment, right: Payment) {
	return new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime();
}

function compareAppointmentsDesc(left: Appointment, right: Appointment) {
	const leftTime = new Date(left.startsAt ?? left.bookedAt).getTime();
	const rightTime = new Date(right.startsAt ?? right.bookedAt).getTime();

	return rightTime - leftTime;
}

async function getApiErrorMessage(error: unknown, fallback: string) {
	if (!(error instanceof ApiError)) {
		return fallback;
	}

	try {
		const body = (await error.response.json()) as ApiErrorResponse;
		return typeof body.message === "string" ? body.message : fallback;
	} catch {
		return fallback;
	}
}
