import { useForm } from "@tanstack/react-form";
import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { AlertCircle, LogIn } from "lucide-react";
import { useState } from "react";

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
import { hasSessionCookie } from "@/lib/auth";

const API_BASE_URL =
	import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8080";

type LoginForm = {
	email: string;
	password: string;
};

export const Route = createFileRoute("/login")({
	beforeLoad: async () => {
		const isAuthenticated = await hasSessionCookie();

		if (isAuthenticated) {
			throw redirect({ to: "/" });
		}
	},
	component: LoginPage,
});

function LoginPage() {
	const navigate = useNavigate();
	const [formError, setFormError] = useState("");

	const form = useForm({
		defaultValues: {
			email: "",
			password: "",
		} as LoginForm,
		onSubmit: async ({ value }) => {
			setFormError("");

			const response = await fetch(`${API_BASE_URL}/api/v1/auth/login`, {
				method: "POST",
				credentials: "include",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(value),
			});

			if (!response.ok) {
				setFormError("Email atau password tidak valid.");
				return;
			}

			await navigate({ to: "/" });
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
