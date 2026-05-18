import { useForm } from "@tanstack/react-form";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, redirect } from "@tanstack/react-router";
import {
	type ColumnDef,
	flexRender,
	getCoreRowModel,
	useReactTable,
} from "@tanstack/react-table";
import { AlertCircle, Plus } from "lucide-react";
import { useState } from "react";

import { useCreateDoctorMutation } from "@/api/admin/doctors/mutations";
import { adminDoctorQueries } from "@/api/admin/doctors/queries";
import type { Doctor, DoctorRequest } from "@/api/admin/doctors/types";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
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
	const doctorsTable = useReactTable({
		columns: doctorColumns,
		data: doctorsQuery.data ?? [],
		getCoreRowModel: getCoreRowModel(),
	});
	const createDoctorMutation = useCreateDoctorMutation();
	const [formError, setFormError] = useState("");
	const [formSuccess, setFormSuccess] = useState("");

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

	return (
		<main className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-6 py-10">
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

			<div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
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
						<Table>
							<TableHeader>
								{doctorsTable.getHeaderGroups().map((headerGroup) => (
									<TableRow key={headerGroup.id}>
										{headerGroup.headers.map((header) => (
											<TableHead key={header.id}>
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
														? "font-medium"
														: undefined
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
								Tambahkan dokter pertama melalui formulir di samping.
							</p>
						</div>
					)
				) : null}

				<Card>
					<CardHeader>
						<CardTitle>Tambah Dokter</CardTitle>
						<CardDescription>
							Akun dokter baru akan langsung bisa digunakan untuk masuk.
						</CardDescription>
					</CardHeader>
					<CardContent>
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
						</form>
					</CardContent>
				</Card>
			</div>
		</main>
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
