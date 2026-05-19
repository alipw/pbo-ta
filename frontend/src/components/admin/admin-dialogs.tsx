import { AlertCircle } from "lucide-react";
import type * as React from "react";

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
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

type AdminFormDialogProps = {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	title: React.ReactNode;
	description?: React.ReactNode;
	trigger?: React.ReactNode;
	children: React.ReactNode;
	contentClassName?: string;
};

function AdminFormDialog({
	open,
	onOpenChange,
	title,
	description,
	trigger,
	children,
	contentClassName,
}: AdminFormDialogProps) {
	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			{trigger ? <DialogTrigger asChild>{trigger}</DialogTrigger> : null}
			<DialogContent className={cn("sm:max-w-md", contentClassName)}>
				<DialogHeader>
					<DialogTitle>{title}</DialogTitle>
					{description ? (
						<DialogDescription>{description}</DialogDescription>
					) : null}
				</DialogHeader>
				{children}
			</DialogContent>
		</Dialog>
	);
}

type AdminDeleteDialogProps = {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	title: React.ReactNode;
	description: React.ReactNode;
	error?: string;
	isPending: boolean;
	onConfirm: () => void;
	confirmLabel?: string;
	pendingLabel?: string;
	cancelLabel?: string;
	confirmIcon?: React.ReactNode;
};

function AdminDeleteDialog({
	open,
	onOpenChange,
	title,
	description,
	error,
	isPending,
	onConfirm,
	confirmLabel = "Hapus",
	pendingLabel = "Menghapus...",
	cancelLabel = "Batal",
	confirmIcon,
}: AdminDeleteDialogProps) {
	return (
		<AlertDialog open={open} onOpenChange={onOpenChange}>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>{title}</AlertDialogTitle>
					<AlertDialogDescription>{description}</AlertDialogDescription>
				</AlertDialogHeader>

				{error ? (
					<Alert variant="destructive">
						<AlertCircle className="size-4" />
						<AlertDescription>{error}</AlertDescription>
					</Alert>
				) : null}

				<AlertDialogFooter className="-mx-4 border-t px-4 pt-4">
					<AlertDialogCancel disabled={isPending}>
						{cancelLabel}
					</AlertDialogCancel>
					<Button
						type="button"
						variant="destructive"
						disabled={isPending}
						onClick={onConfirm}
					>
						{confirmIcon}
						{isPending ? pendingLabel : confirmLabel}
					</Button>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}

export { AdminDeleteDialog, AdminFormDialog };
