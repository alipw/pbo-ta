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
	Eye,
	Pencil,
	Plus,
	Trash2,
} from "lucide-react";
import { useMemo, useState } from "react";

import {
	useCreateDoctorMutation,
	useDeleteDoctorMutation,
	useUpdateDoctorMutation,
} from "@/api/admin/doctors/mutations";
import { adminDoctorQueries } from "@/api/admin/doctors/queries";
import type { Doctor, DoctorRequest } from "@/api/admin/doctors/types";
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

const doctorDateFormatter = new Intl.DateTimeFormat("id-ID", {
	dateStyle: "medium",
});

const doctorColumns: ColumnDef<Doctor>[] = [
	{
		accessorKey: "fullName",
		header: "Nama",
	},
	{
		accessorKey: "email",
		header: "Email",
	},
	{
		accessorKey: "specialization",
		header: "Spesialisasi",
	},
	{
		accessorKey: "licenseNumber",
		header: "No. Lisensi",
	},
	{
		accessorKey: "createdAt",
		header: "Dibuat",
		cell: ({ getValue }) =>
			doctorDateFormatter.format(new Date(getValue<string>())),
	},
];

type DoctorColumnsOptions = {
	onView: (doctor: Doctor) => void;
	onEdit: (doctor: Doctor) => void;
	onDelete: (doctor: Doctor) => void;
};

function getDoctorColumns({
	onView,
	onEdit,
	onDelete,
}: DoctorColumnsOptions): ColumnDef<Doctor>[] {
	return [
		...doctorColumns,
		{
			id: "actions",
			header: () => <span className="sr-only">Aksi</span>,
			cell: ({ row }) => {
				const doctor = row.original;

				return (
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button
								type="button"
								variant="ghost"
								size="icon"
								aria-label={`Buka menu aksi ${doctor.fullName}`}
							>
								<EllipsisVertical className="size-4" />
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align="end">
							<DropdownMenuItem onSelect={() => onView(doctor)}>
								<Eye />
								Lihat detail
							</DropdownMenuItem>
							<DropdownMenuItem onSelect={() => onEdit(doctor)}>
								<Pencil />
								Edit
							</DropdownMenuItem>
							<DropdownMenuSeparator />
							<DropdownMenuItem
								className="text-destructive focus:bg-destructive/10 focus:text-destructive"
								onSelect={() => onDelete(doctor)}
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

export const Route = createFileRoute("/_authenticated/admin/doctors")({
	beforeLoad: ({ context }) => {
		const { user } = context;

		if (user.role !== "ADMIN") {
			throw redirect({ to: roleHomePath[user.role] });
		}
	},
	component: AdminDoctorsPage,
});

function AdminDoctorsPage() {
	const doctorsQuery = useQuery({
		...adminDoctorQueries.list(),
		enabled: typeof window !== "undefined",
	});
	const createDoctorMutation = useCreateDoctorMutation();
	const updateDoctorMutation = useUpdateDoctorMutation();
	const deleteDoctorMutation = useDeleteDoctorMutation();
	const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
	const [editingDoctor, setEditingDoctor] = useState<Doctor | null>(null);
	const [deletingDoctor, setDeletingDoctor] = useState<Doctor | null>(null);
	const [formError, setFormError] = useState("");
	const [formSuccess, setFormSuccess] = useState("");
	const [editFormError, setEditFormError] = useState("");
	const [editFormSuccess, setEditFormSuccess] = useState("");
	const [deleteError, setDeleteError] = useState("");
	const columns = useMemo(
		() =>
			getDoctorColumns({
				onView: () => undefined,
				onEdit: (doctor) => {
					setEditFormError("");
					setEditFormSuccess("");
					setEditingDoctor(doctor);
				},
				onDelete: (doctor) => {
					setDeleteError("");
					setDeletingDoctor(doctor);
				},
			}),
		[],
	);
	const doctorsTable = useReactTable({
		columns,
		data: doctorsQuery.data ?? [],
		getCoreRowModel: getCoreRowModel(),
	});

	const form = useForm({
		defaultValues: {
			fullName: "",
			email: "",
			password: "",
			specialization: "",
			licenseNumber: "",
		} as DoctorRequest,
		onSubmit: async ({ value, formApi }) => {
			setFormError("");
			setFormSuccess("");

			try {
				await createDoctorMutation.mutateAsync(value);
				formApi.reset();
				setFormSuccess("Dokter berhasil ditambahkan.");
			} catch {
				setFormError("Dokter gagal ditambahkan. Periksa data lalu coba lagi.");
			}
		},
	});

	async function handleDeleteDoctor() {
		if (!deletingDoctor) {
			return;
		}

		setDeleteError("");

		try {
			await deleteDoctorMutation.mutateAsync(deletingDoctor.id);
			setDeletingDoctor(null);
		} catch {
			setDeleteError("Dokter gagal dihapus. Coba lagi.");
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
						Daftar Dokter
					</h1>
					<p className="max-w-2xl text-sm text-muted-foreground">
						Kelola data dokter, spesialisasi, nomor lisensi, dan akun masuk.
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
								Tambah Dokter
							</Button>
						</DialogTrigger>
						<DialogContent className="sm:max-w-md">
							<DialogHeader>
								<DialogTitle>Tambah Dokter</DialogTitle>
								<DialogDescription>
									Akun dokter baru akan langsung bisa digunakan untuk masuk.
								</DialogDescription>
							</DialogHeader>
							<form
								className="space-y-4"
								onSubmit={(event) => {
									event.preventDefault();
									event.stopPropagation();
									void form.handleSubmit();
								}}
							>
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

								<form.Field
									name="fullName"
									validators={{
										onChange: ({ value }) =>
											value.trim().length === 0
												? "Nama wajib diisi."
												: undefined,
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
									name="specialization"
									validators={{
										onChange: ({ value }) =>
											value.trim().length === 0
												? "Spesialisasi wajib diisi."
												: undefined,
									}}
								>
									{(field) => <TextField field={field} label="Spesialisasi" />}
								</form.Field>

								<form.Field
									name="licenseNumber"
									validators={{
										onChange: ({ value }) =>
											value.trim().length === 0
												? "Nomor lisensi wajib diisi."
												: undefined,
									}}
								>
									{(field) => <TextField field={field} label="Nomor Lisensi" />}
								</form.Field>

								<DialogFooter className="-mx-4 border-t px-4 pt-4">
									<form.Subscribe
										selector={(state) => [state.canSubmit, state.isSubmitting]}
									>
										{([canSubmit, isSubmitting]) => (
											<Button
												className="w-full"
												disabled={
													!canSubmit ||
													isSubmitting ||
													createDoctorMutation.isPending
												}
												size="lg"
												type="submit"
											>
												<Plus className="size-4" />
												{isSubmitting || createDoctorMutation.isPending
													? "Menyimpan..."
													: "Tambah Dokter"}
											</Button>
										)}
									</form.Subscribe>
								</DialogFooter>
							</form>
						</DialogContent>
					</Dialog>
				</div>

				{editingDoctor ? (
					<EditDoctorDialog
						key={editingDoctor.id}
						doctor={editingDoctor}
						error={editFormError}
						success={editFormSuccess}
						isPending={updateDoctorMutation.isPending}
						onOpenChange={(open) => {
							if (!open) {
								setEditingDoctor(null);
								setEditFormError("");
								setEditFormSuccess("");
							}
						}}
						onSubmit={async (value) => {
							setEditFormError("");
							setEditFormSuccess("");

							try {
								await updateDoctorMutation.mutateAsync({
									doctorId: editingDoctor.id,
									request: value,
								});
								setEditFormSuccess("Dokter berhasil diperbarui.");
							} catch {
								setEditFormError(
									"Dokter gagal diperbarui. Periksa data lalu coba lagi.",
								);
							}
						}}
					/>
				) : null}

				<AlertDialog
					open={Boolean(deletingDoctor)}
					onOpenChange={(open) => {
						if (!open && !deleteDoctorMutation.isPending) {
							setDeletingDoctor(null);
							setDeleteError("");
						}
					}}
				>
					<AlertDialogContent>
						<AlertDialogHeader>
							<AlertDialogTitle>Hapus Dokter?</AlertDialogTitle>
							<AlertDialogDescription>
								{deletingDoctor
									? `${deletingDoctor.fullName} akan dihapus dari daftar dokter. Tindakan ini tidak dapat dibatalkan.`
									: "Dokter ini akan dihapus dari daftar dokter."}
							</AlertDialogDescription>
						</AlertDialogHeader>

						{deleteError ? (
							<Alert variant="destructive">
								<AlertCircle className="size-4" />
								<AlertDescription>{deleteError}</AlertDescription>
							</Alert>
						) : null}

						<AlertDialogFooter className="-mx-4 border-t px-4 pt-4">
							<AlertDialogCancel disabled={deleteDoctorMutation.isPending}>
								Batal
							</AlertDialogCancel>
							<Button
								type="button"
								variant="destructive"
								disabled={deleteDoctorMutation.isPending}
								onClick={() => {
									void handleDeleteDoctor();
								}}
							>
								<Trash2 className="size-4" />
								{deleteDoctorMutation.isPending ? "Menghapus..." : "Hapus"}
							</Button>
						</AlertDialogFooter>
					</AlertDialogContent>
				</AlertDialog>

				{doctorsQuery.isPending ? <DoctorTableSkeleton /> : null}

				{doctorsQuery.isError ? (
					<Alert variant="destructive">
						<AlertCircle className="size-4" />
						<AlertDescription>
							Daftar dokter gagal dimuat. Coba muat ulang halaman.
						</AlertDescription>
					</Alert>
				) : null}

				{doctorsQuery.isSuccess ? (
					doctorsTable.getRowModel().rows.length > 0 ? (
						<Table className="text-sm">
							<TableHeader>
								{doctorsTable.getHeaderGroups().map((headerGroup) => (
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
								{doctorsTable.getRowModel().rows.map((row) => (
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
							<p className="font-medium">Belum ada dokter.</p>
							<p className="mt-1 text-sm text-muted-foreground">
								Tambahkan dokter pertama melalui tombol di atas tabel.
							</p>
						</div>
					)
				) : null}
			</div>
		</main>
	);
}

type EditDoctorDialogProps = {
	doctor: Doctor;
	error: string;
	success: string;
	isPending: boolean;
	onOpenChange: (open: boolean) => void;
	onSubmit: (value: DoctorRequest) => Promise<void>;
};

function EditDoctorDialog({
	doctor,
	error,
	success,
	isPending,
	onOpenChange,
	onSubmit,
}: EditDoctorDialogProps) {
	const form = useForm({
		defaultValues: {
			fullName: doctor.fullName,
			email: doctor.email,
			password: "",
			specialization: doctor.specialization,
			licenseNumber: doctor.licenseNumber,
		} as DoctorRequest,
		onSubmit: async ({ value }) => {
			await onSubmit(value);
		},
	});

	return (
		<Dialog open onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle>Edit Dokter</DialogTitle>
					<DialogDescription>
						Perbarui data dokter. Masukkan password baru untuk akun ini.
					</DialogDescription>
				</DialogHeader>
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
						name="specialization"
						validators={{
							onChange: ({ value }) =>
								value.trim().length === 0
									? "Spesialisasi wajib diisi."
									: undefined,
						}}
					>
						{(field) => <TextField field={field} label="Spesialisasi" />}
					</form.Field>

					<form.Field
						name="licenseNumber"
						validators={{
							onChange: ({ value }) =>
								value.trim().length === 0
									? "Nomor lisensi wajib diisi."
									: undefined,
						}}
					>
						{(field) => <TextField field={field} label="Nomor Lisensi" />}
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
									<Pencil className="size-4" />
									{isSubmitting || isPending ? "Menyimpan..." : "Simpan Dokter"}
								</Button>
							)}
						</form.Subscribe>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}

type TextFieldProps = {
	field: {
		name: keyof DoctorRequest;
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
	const inputId = `doctor-${field.name}`;

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

function DoctorTableSkeleton() {
	return (
		<div className="space-y-3">
			<Skeleton className="h-9 w-full" />
			<Skeleton className="h-9 w-full" />
			<Skeleton className="h-9 w-3/4" />
		</div>
	);
}
