import { Link, useNavigate } from "@tanstack/react-router";
import {
	CalendarClock,
	CalendarDays,
	CalendarPlus,
	ClipboardPlus,
	CreditCard,
	FileText,
	Stethoscope,
	Users,
} from "lucide-react";
import { useLogoutMutation } from "@/api/auth/mutations";
import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarGroup,
	SidebarGroupContent,
	SidebarGroupLabel,
	SidebarHeader,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
} from "@/components/ui/sidebar";
import type { UserRole } from "@/lib/auth";

type NavItem = {
	title: string;
	url: string;
	icon: React.ComponentType<{ className?: string }>;
};

type NavGroup = {
	label: string;
	items: NavItem[];
};

const adminNav: NavGroup[] = [
	{
		label: "Manajemen",
		items: [
			{ title: "Dokter", url: "/admin/doctors", icon: Stethoscope },
			{ title: "Pasien", url: "/admin/patients", icon: Users },
			{ title: "Appointment", url: "/admin/appointments", icon: CalendarDays },
			{ title: "Jadwal", url: "/admin/schedules", icon: CalendarClock },
			{ title: "Rekam Medis", url: "/admin/records", icon: FileText },
			{ title: "Pembayaran", url: "/admin/payments", icon: CreditCard },
		],
	},
];

const doctorNav: NavGroup[] = [
	{
		label: "Dokter",
		items: [
			{
				title: "Jadwal Saya",
				url: "/doctor/appointments",
				icon: CalendarClock,
			},
			{ title: "Rekam Medis", url: "/doctor/records", icon: ClipboardPlus },
		],
	},
];

const patientNav: NavGroup[] = [
	{
		label: "Pasien",
		items: [
			{ title: "Janji Temu", url: "/patient", icon: CalendarPlus },
			{ title: "Rekam Medis", url: "/patient/records", icon: FileText },
			{ title: "Pembayaran", url: "/patient/payments", icon: CreditCard },
		],
	},
];

const roleNav: Record<UserRole, NavGroup[]> = {
	ADMIN: adminNav,
	DOCTOR: doctorNav,
	PATIENT: patientNav,
};

type AppSidebarProps = React.ComponentProps<typeof Sidebar> & {
	userEmail: string;
	userRole: UserRole;
};

export function AppSidebar({ userEmail, userRole, ...props }: AppSidebarProps) {
	const navigate = useNavigate();
	const logoutMutation = useLogoutMutation();
	const navGroups = roleNav[userRole] ?? [];
	const roleLabel =
		userRole === "ADMIN"
			? "Admin"
			: userRole === "DOCTOR"
				? "Dokter"
				: "Pasien";

	const handleLogout = async () => {
		try {
			await logoutMutation.mutateAsync();
		} finally {
			await navigate({ to: "/login" });
		}
	};

	return (
		<Sidebar {...props}>
			<SidebarHeader>
				<SidebarMenu>
					<SidebarMenuItem>
						<SidebarMenuButton size="lg" className="h-14" asChild>
							<Link
								to={
									userRole === "ADMIN"
										? "/admin"
										: userRole === "DOCTOR"
											? "/doctor"
											: "/patient"
								}
							>
								<div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
									<Stethoscope className="size-4" />
								</div>
								<div className="flex min-w-0 flex-1 flex-col gap-0.5 leading-none">
									<span className="font-semibold">Klinikku</span>
									<span className="text-xs text-muted-foreground">
										{roleLabel}
									</span>
									<span className="truncate text-xs text-muted-foreground">
										{userEmail}
									</span>
								</div>
							</Link>
						</SidebarMenuButton>
					</SidebarMenuItem>
				</SidebarMenu>
			</SidebarHeader>
			<SidebarContent>
				{navGroups.map((group) => (
					<SidebarGroup key={group.label}>
						<SidebarGroupLabel>{group.label}</SidebarGroupLabel>
						<SidebarGroupContent>
							<SidebarMenu>
								{group.items.map((item) => (
									<SidebarMenuItem key={item.title}>
										<SidebarMenuButton asChild>
											<Link to={item.url}>
												<item.icon className="size-4" />
												<span>{item.title}</span>
											</Link>
										</SidebarMenuButton>
									</SidebarMenuItem>
								))}
							</SidebarMenu>
						</SidebarGroupContent>
					</SidebarGroup>
				))}
			</SidebarContent>
			<SidebarFooter>
				<SidebarMenu>
					<SidebarMenuItem>
						<SidebarMenuButton asChild>
							<button
								type="button"
								className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm font-medium hover:bg-accent hover:text-accent-foreground"
								disabled={logoutMutation.isPending}
								onClick={handleLogout}
							>
								<span>
									{logoutMutation.isPending ? "Memproses..." : "Keluar"}
								</span>
							</button>
						</SidebarMenuButton>
					</SidebarMenuItem>
				</SidebarMenu>
			</SidebarFooter>
		</Sidebar>
	);
}
