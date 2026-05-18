import { useForm } from "@tanstack/react-form";
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
	EllipsisVertical,
	Pencil,
	Plus,
	Trash2,
} from "lucide-react";
import { useMemo, useState } from "react";

import {
	useCreatePatientMutation,
	useDeletePatientMutation,
	useUpdatePatientMutation,
} from "@/api/admin/patients/mutations";
import { adminPatientQueries } from "@/api/admin/patients/queries";
import type { Patient, PatientRequest } from "@/api/admin/patients/types";
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
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
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

const patientDateFormatter = new Intl.DateTimeFormat("id-ID", {
	dateStyle: "medium",
});

type PatientFormValues = {
	fullName: string;
	email: string;
	password: string;
	phoneNumber: string;
	dateOfBirth: string;
};

const emptyPatientFormValues: PatientFormValues = {
	fullName: "",
	email: "",
	password: "",
	phoneNumber: "",
	dateOfBirth: "",
};

const patientColumns: ColumnDef<Patient>[] = [
	{
		accessorKey: "fullName",
		header: "Nama",
	},
	{
		accessorKey: "email",
		header: "Email",
	},
	{
		accessorKey: "phoneNumber",
		header: "No. Telepon",
	},
	{
		accessorKey: "dateOfBirth",
		header: "Tanggal Lahir",
		cell: ({ getValue }) => {
			const dateOfBirth = getValue<string | null>();

			return dateOfBirth
				? patientDateFormatter.format(new Date(dateOfBirth))
				: "-";
		},
	},
	{
		accessorKey: "createdAt",
		header: "Dibuat",
		cell: ({ getValue }) =>
			patientDateFormatter.format(new Date(getValue<string>())),
	},
];

type PatientColumnsOptions = {
	onEdit: (patient: Patient) => void;
	onDelete: (patient: Patient) => void;
};

function getPatientColumns({
	onEdit,
	onDelete,
}: PatientColumnsOptions): ColumnDef<Patient>[] {
	return [
		...patientColumns,
		{
			id: "actions",
			header: () => <span className="sr-only">Aksi</span>,
			cell: ({ row }) => {
				const patient = row.original;

				return (
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button
								type="button"
								variant="ghost"
								size="icon"
								aria-label={`Buka menu aksi ${patient.fullName}`}
							>
								<EllipsisVertical className="size-4" />
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align="end">
							<DropdownMenuItem onSelect={() => onEdit(patient)}>
								<Pencil />
								Edit
							</DropdownMenuItem>
							<DropdownMenuSeparator />
							<DropdownMenuItem
								className="text-destructive focus:bg-destructive/10 focus:text-destructive"
								onSelect={() => onDelete(patient)}
							>
								<Trash2 />
								Hapus
							</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>
				);
			},
		},
	];
}

export const Route = createFileRoute("/_authenticated/admin/patients")({
	beforeLoad: ({ context }) => {
		const { user } = context;

		if (user.role !== "ADMIN") {
			throw redirect({ to: roleHomePath[user.role] });
		}
	},
	component: AdminPatientsPage,
});

function AdminPatientsPage() {
	const patientsQuery = useQuery({
		...adminPatientQueries.list(),
		enabled: typeof window !== "undefined",
	});
	const createPatientMutation = useCreatePatientMutation();
	const updatePatientMutation = useUpdatePatientMutation();
	const deletePatientMutation = useDeletePatientMutation();
	const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
	const [editingPatient, setEditingPatient] = useState<Patient | null>(null);
	const [deletingPatient, setDeletingPatient] = useState<Patient | null>(null);
	const [formError, setFormError] = useState("");
	const [formSuccess, setFormSuccess] = useState("");
	const [editFormError, setEditFormError] = useState("");
	const [editFormSuccess, setEditFormSuccess] = useState("");
	const [deleteError, setDeleteError] = useState("");
	const columns = useMemo(
		() =>
			getPatientColumns({
				onEdit: (patient) => {
					setEditFormError("");
					setEditFormSuccess("");
					setEditingPatient(patient);
				},
				onDelete: (patient) => {
					setDeleteError("");
					setDeletingPatient(patient);
				},
			}),
		[],
	);
	const patientsTable = useReactTable({
		columns,
		data: patientsQuery.data ?? [],
		getCoreRowModel: getCoreRowModel(),
	});

	const form = useForm({
		defaultValues: emptyPatientFormValues,
		onSubmit: async ({ value, formApi }) => {
			setFormError("");
			setFormSuccess("");

			try {
				await createPatientMutation.mutateAsync(patientRequestFromForm(value));
				formApi.reset();
				setFormSuccess("Pasien berhasil ditambahkan.");
			} catch {
				setFormError("Pasien gagal ditambahkan. Periksa data lalu coba lagi.");
			}
		},
	});

	async function handleDeletePatient() {
		if (!deletingPatient) {
			return;
		}

		setDeleteError("");

		try {
			await deletePatientMutation.mutateAsync(deletingPatient.id);
			setDeletingPatient(null);
		} catch {
			setDeleteError("Pasien gagal dihapus. Coba lagi.");
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
						Daftar Pasien
					</h1>
					<p className="max-w-2xl text-sm text-muted-foreground">
						Kelola data pasien, kontak, tanggal lahir, dan akun masuk.
					</p>
				</div>
			</section>

			<div className="space-y-4">
				<div className="flex justify-end">
					<Dialog
						open={isCreateDialogOpen}
						onOpenChange={(open) => {
							setIsCreateDialogOpen(open);

							if (open) {
								setFormError("");
								setFormSuccess("");
							}
						}}
					>
						<DialogTrigger asChild>
							<Button size="lg">
								<Plus className="size-4" />
								Tambah Pasien
							</Button>
						</DialogTrigger>
						<DialogContent className="sm:max-w-md">
							<DialogHeader>
								<DialogTitle>Tambah Pasien</DialogTitle>
								<DialogDescription>
									Akun pasien baru akan langsung bisa digunakan untuk masuk.
								</DialogDescription>
							</DialogHeader>
							<PatientForm
								form={form}
								error={formError}
								success={formSuccess}
								isPending={createPatientMutation.isPending}
								submitLabel="Tambah Pasien"
								pendingLabel="Menyimpan..."
								icon={<Plus className="size-4" />}
							/>
						</DialogContent>
					</Dialog>
				</div>

				{editingPatient ? (
					<EditPatientDialog
						key={editingPatient.id}
						patient={editingPatient}
						error={editFormError}
						success={editFormSuccess}
						isPending={updatePatientMutation.isPending}
						onOpenChange={(open) => {
							if (!open) {
								setEditingPatient(null);
								setEditFormError("");
								setEditFormSuccess("");
							}
						}}
						onSubmit={async (value) => {
							setEditFormError("");
							setEditFormSuccess("");

							try {
								await updatePatientMutation.mutateAsync({
									patientId: editingPatient.id,
									request: patientRequestFromForm(value),
								});
								setEditFormSuccess("Pasien berhasil diperbarui.");
							} catch {
								setEditFormError(
									"Pasien gagal diperbarui. Periksa data lalu coba lagi.",
								);
							}
						}}
					/>
				) : null}

				<AlertDialog
					open={Boolean(deletingPatient)}
					onOpenChange={(open) => {
						if (!open && !deletePatientMutation.isPending) {
							setDeletingPatient(null);
							setDeleteError("");
						}
					}}
				>
					<AlertDialogContent>
						<AlertDialogHeader>
							<AlertDialogTitle>Hapus Pasien?</AlertDialogTitle>
							<AlertDialogDescription>
								{deletingPatient
									? `${deletingPatient.fullName} akan dihapus dari daftar pasien. Tindakan ini tidak dapat dibatalkan.`
									: "Pasien ini akan dihapus dari daftar pasien."}
							</AlertDialogDescription>
						</AlertDialogHeader>

						{deleteError ? (
							<Alert variant="destructive">
								<AlertCircle className="size-4" />
								<AlertDescription>{deleteError}</AlertDescription>
							</Alert>
						) : null}

						<AlertDialogFooter className="-mx-4 border-t px-4 pt-4">
							<AlertDialogCancel disabled={deletePatientMutation.isPending}>
								Batal
							</AlertDialogCancel>
							<Button
								type="button"
								variant="destructive"
								disabled={deletePatientMutation.isPending}
								onClick={() => {
									void handleDeletePatient();
								}}
							>
								<Trash2 className="size-4" />
								{deletePatientMutation.isPending ? "Menghapus..." : "Hapus"}
							</Button>
						</AlertDialogFooter>
					</AlertDialogContent>
				</AlertDialog>

				{patientsQuery.isPending ? <PatientTableSkeleton /> : null}

				{patientsQuery.isError ? (
					<Alert variant="destructive">
						<AlertCircle className="size-4" />
						<AlertDescription>
							Daftar pasien gagal dimuat. Coba muat ulang halaman.
						</AlertDescription>
					</Alert>
				) : null}

				{patientsQuery.isSuccess ? (
					patientsTable.getRowModel().rows.length > 0 ? (
						<Table className="text-sm">
							<TableHeader>
								{patientsTable.getHeaderGroups().map((headerGroup) => (
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
								{patientsTable.getRowModel().rows.map((row) => (
									<TableRow key={row.id}>
										{row.getVisibleCells().map((cell) => (
											<TableCell
												key={cell.id}
												className={
													cell.column.id === "fullName"
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
							<p className="font-medium">Belum ada pasien.</p>
							<p className="mt-1 text-sm text-muted-foreground">
								Tambahkan pasien pertama melalui tombol di atas tabel.
							</p>
						</div>
					)
				) : null}
			</div>
		</main>
	);
}

type EditPatientDialogProps = {
	patient: Patient;
	error: string;
	success: string;
	isPending: boolean;
	onOpenChange: (open: boolean) => void;
	onSubmit: (value: PatientFormValues) => Promise<void>;
};

function EditPatientDialog({
	patient,
	error,
	success,
	isPending,
	onOpenChange,
	onSubmit,
}: EditPatientDialogProps) {
	const form = useForm({
		defaultValues: {
			fullName: patient.fullName,
			email: patient.email,
			password: "",
			phoneNumber: patient.phoneNumber,
			dateOfBirth: patient.dateOfBirth ?? "",
		} as PatientFormValues,
		onSubmit: async ({ value }) => {
			await onSubmit(value);
		},
	});

	return (
		<Dialog open onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle>Edit Pasien</DialogTitle>
					<DialogDescription>
						Perbarui data pasien. Masukkan password baru untuk akun ini.
					</DialogDescription>
				</DialogHeader>
				<PatientForm
					form={form}
					error={error}
					success={success}
					isPending={isPending}
					submitLabel="Simpan Pasien"
					pendingLabel="Menyimpan..."
					icon={<Pencil className="size-4" />}
				/>
			</DialogContent>
		</Dialog>
	);
}

type PatientFormProps = {
	form: PatientFormApi;
	error: string;
	success: string;
	isPending: boolean;
	submitLabel: string;
	pendingLabel: string;
	icon: React.ReactNode;
};

type PatientFormApi = {
	handleSubmit: () => void | Promise<void>;
	Field: React.ComponentType<{
		name: keyof PatientFormValues;
		validators?: {
			onChange?: (props: { value: string }) => string | undefined;
		};
		children: (field: TextFieldProps["field"]) => React.ReactNode;
	}>;
	Subscribe: React.ComponentType<{
		selector: (state: FormSubmitState) => [boolean, boolean];
		children: (state: [boolean, boolean]) => React.ReactNode;
	}>;
};

type FormSubmitState = {
	canSubmit: boolean;
	isSubmitting: boolean;
};

function PatientForm({
	form,
	error,
	success,
	isPending,
	submitLabel,
	pendingLabel,
	icon,
}: PatientFormProps) {
	return (
		<form
			className="space-y-4"
			onSubmit={(event) => {
				event.preventDefault();
				event.stopPropagation();
				void form.handleSubmit();
			}}
		>
			{error ? (
				<Alert variant="destructive">
					<AlertCircle className="size-4" />
					<AlertDescription>{error}</AlertDescription>
				</Alert>
			) : null}

			{success ? (
				<Alert>
					<AlertDescription>{success}</AlertDescription>
				</Alert>
			) : null}

			<form.Field
				name="fullName"
				validators={{
					onChange: ({ value }) =>
						value.trim().length === 0 ? "Nama wajib diisi." : undefined,
				}}
			>
				{(field) => <TextField field={field} label="Nama Lengkap" />}
			</form.Field>

			<form.Field
				name="email"
				validators={{
					onChange: ({ value }) => {
						if (value.trim().length === 0) {
							return "Email wajib diisi.";
						}

						return value.includes("@")
							? undefined
							: "Format email tidak valid.";
					},
				}}
			>
				{(field) => (
					<TextField
						field={field}
						label="Email"
						type="email"
						autoComplete="email"
					/>
				)}
			</form.Field>

			<form.Field
				name="password"
				validators={{
					onChange: ({ value }) =>
						value.length === 0 ? "Password wajib diisi." : undefined,
				}}
			>
				{(field) => (
					<TextField
						field={field}
						label="Password"
						type="password"
						autoComplete="new-password"
					/>
				)}
			</form.Field>

			<Separator />

			<form.Field
				name="phoneNumber"
				validators={{
					onChange: ({ value }) =>
						value.trim().length === 0
							? "Nomor telepon wajib diisi."
							: undefined,
				}}
			>
				{(field) => (
					<TextField
						field={field}
						label="Nomor Telepon"
						type="tel"
						autoComplete="tel"
					/>
				)}
			</form.Field>

			<form.Field name="dateOfBirth">
				{(field) => (
					<TextField field={field} label="Tanggal Lahir" type="date" />
				)}
			</form.Field>

			<DialogFooter className="-mx-4 border-t px-4 pt-4">
				<form.Subscribe
					selector={(state) => [state.canSubmit, state.isSubmitting]}
				>
					{([canSubmit, isSubmitting]) => (
						<Button
							className="w-full"
							disabled={!canSubmit || isSubmitting || isPending}
							size="lg"
							type="submit"
						>
							{icon}
							{isSubmitting || isPending ? pendingLabel : submitLabel}
						</Button>
					)}
				</form.Subscribe>
			</DialogFooter>
		</form>
	);
}

function patientRequestFromForm(value: PatientFormValues): PatientRequest {
	return {
		...value,
		dateOfBirth: value.dateOfBirth || null,
	};
}

type TextFieldProps = {
	field: {
		name: keyof PatientFormValues;
		state: {
			value: string;
			meta: {
				errors: unknown[];
			};
		};
		handleBlur: () => void;
		handleChange: (value: string) => void;
	};
	label: string;
	type?: React.HTMLInputTypeAttribute;
	autoComplete?: string;
};

function TextField({
	field,
	label,
	type = "text",
	autoComplete,
}: TextFieldProps) {
	const errorMessage = field.state.meta.errors.at(0);
	const inputId = `patient-${field.name}`;

	return (
		<div className="space-y-1.5">
			<Label htmlFor={inputId}>{label}</Label>
			<Input
				id={inputId}
				name={field.name}
				type={type}
				autoComplete={autoComplete}
				value={field.state.value}
				aria-invalid={Boolean(errorMessage)}
				onBlur={field.handleBlur}
				onChange={(event) => field.handleChange(event.target.value)}
			/>
			{errorMessage ? (
				<p className="text-xs text-destructive">{String(errorMessage)}</p>
			) : null}
		</div>
	);
}

function PatientTableSkeleton() {
	return (
		<div className="space-y-3">
			<Skeleton className="h-9 w-full" />
			<Skeleton className="h-9 w-full" />
			<Skeleton className="h-9 w-3/4" />
		</div>
	);
}
