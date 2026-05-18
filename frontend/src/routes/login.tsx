import { useForm } from "@tanstack/react-form";
import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { AlertCircle, LogIn } from "lucide-react";
import { useState } from "react";

import { useLoginMutation } from "@/api/auth/mutations";
import { authQueries } from "@/api/auth/queries";
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
import { getCurrentUser, roleHomePath } from "@/lib/auth";

type LoginForm = {
	email: string;
	password: string;
};

export const Route = createFileRoute("/login")({
	beforeLoad: async ({ context }) => {
		const user = await context.queryClient.ensureQueryData(
			authQueries.currentUser(getCurrentUser),
		);

		if (user) {
			throw redirect({ to: roleHomePath[user.role] });
		}
	},
	component: LoginPage,
});

function LoginPage() {
	const navigate = useNavigate();
	const loginMutation = useLoginMutation();
	const [formError, setFormError] = useState("");

	const form = useForm({
		defaultValues: {
			email: "",
			password: "",
		} as LoginForm,
		onSubmit: async ({ value }) => {
			setFormError("");

			try {
				const user = await loginMutation.mutateAsync(value);
				await navigate({ to: roleHomePath[user.role] });
			} catch {
				setFormError("Email atau password tidak valid.");
			}
		},
	});

	return (
		<main className="flex min-h-screen items-center justify-center bg-muted/30 px-4 py-8">
			<Card className="w-full max-w-sm">
				<CardHeader>
					<CardTitle>Masuk</CardTitle>
					<CardDescription>
						Gunakan akun Klinikku untuk membuka dashboard.
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

						<form.Field
							name="email"
							validators={{
								onChange: ({ value }) =>
									value.trim().length === 0 ? "Email wajib diisi." : undefined,
							}}
						>
							{(field) => {
								const errorMessage = field.state.meta.errors.at(0);

								return (
									<div className="space-y-1.5">
										<Label htmlFor={field.name}>Email / Username</Label>
										<Input
											id={field.name}
											name={field.name}
											autoComplete="email"
											value={field.state.value}
											aria-invalid={Boolean(errorMessage)}
											onBlur={field.handleBlur}
											onChange={(event) =>
												field.handleChange(event.target.value)
											}
										/>
										{errorMessage ? (
											<p className="text-xs text-destructive">{errorMessage}</p>
										) : null}
									</div>
								);
							}}
						</form.Field>

						<form.Field
							name="password"
							validators={{
								onChange: ({ value }) =>
									value.length === 0 ? "Password wajib diisi." : undefined,
							}}
						>
							{(field) => {
								const errorMessage = field.state.meta.errors.at(0);

								return (
									<div className="space-y-1.5">
										<Label htmlFor={field.name}>Password</Label>
										<Input
											id={field.name}
											name={field.name}
											type="password"
											autoComplete="current-password"
											value={field.state.value}
											aria-invalid={Boolean(errorMessage)}
											onBlur={field.handleBlur}
											onChange={(event) =>
												field.handleChange(event.target.value)
											}
										/>
										{errorMessage ? (
											<p className="text-xs text-destructive">{errorMessage}</p>
										) : null}
									</div>
								);
							}}
						</form.Field>

						<form.Subscribe
							selector={(state) => [state.canSubmit, state.isSubmitting]}
						>
							{([canSubmit, isSubmitting]) => (
								<Button
									className="w-full"
									disabled={!canSubmit || isSubmitting}
									size="lg"
									type="submit"
								>
									<LogIn className="size-4" />
									{isSubmitting ? "Memproses..." : "Masuk"}
								</Button>
							)}
						</form.Subscribe>
					</form>
				</CardContent>
			</Card>
		</main>
	);
}
