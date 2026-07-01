"use client";

import { useTranslation } from "@i18n/client";
import { Link, useLocation, useNavigate } from "@remix-run/react";
import { useHotkeys } from "react-hotkeys-hook";
import { useUser } from "~/features/auth/components/auth-provider";
import {
	BudgetsIcon,
	DebtsIcon,
	ExpensesIcon,
	GoalsIcon,
	IncomeIcon,
	InvestmentIcon,
	OverviewIcon,
	ProfileIcon,
	SettingsIcon,
	SignoutIcon,
	SubscriptionsIcon,
	SupportIcon,
	WalletIcon,
} from "~/shared/components/icons";
import { Separator } from "~/shared/components/ui/separator";
import shortcuts from "~/shared/constants/shortcuts";

import { cn } from "~/shared/lib/utils";
import { useSidebarOpen, useUiActions } from "~/shared/stores/ui/ui.store";

import SidebarLink from "./link";

const _dashboardLinks = [
	{ name: "Overview", href: "/dashboard", Icon: OverviewIcon, shortcutText: shortcuts.menu.overview.shortcut },
	{ name: "Income", href: "/dashboard/income", Icon: IncomeIcon, shortcutText: shortcuts.menu.income.shortcut },
	{ name: "Expenses", href: "/dashboard/expenses", Icon: ExpensesIcon, shortcutText: shortcuts.menu.expenses.shortcut },
	{
		name: "Investments",
		href: "/dashboard/investments",
		Icon: InvestmentIcon,
		shortcutText: shortcuts.menu.investments.shortcut,
	},
	{
		name: "Subscriptions",
		href: "/dashboard/subscriptions",
		Icon: SubscriptionsIcon,
		shortcutText: shortcuts.menu.subscriptions.shortcut,
	},
];

const settingsLinks = [
	{ href: "/dashboard/profile", name: "Profile", Icon: ProfileIcon },
	{ href: "mailto:support@dompetku", name: "Support", Icon: SupportIcon },
];

const menuShortcutList = Object.values(shortcuts.menu).map((_) => _.shortcut);

const options = {
	keyup: true,
};

export default function Sidebar() {
	const { t } = useTranslation();
	const pathname = useLocation()?.pathname || "/";
	const router = useNavigate();
	const show = useSidebarOpen();
	const { closeSidebar } = useUiActions();
	const user = useUser();

	const navItems = [
		{
			key: "overview",
			name: t("navigation.overview"),
			href: "/dashboard",
			Icon: OverviewIcon,
			shortcut: shortcuts.menu.overview.shortcut,
		},
		{
			key: "income",
			name: t("navigation.income"),
			href: "/dashboard/income",
			Icon: IncomeIcon,
			shortcut: shortcuts.menu.income.shortcut,
		},
		{
			key: "expenses",
			name: t("navigation.expenses"),
			href: "/dashboard/expenses",
			Icon: ExpensesIcon,
			shortcut: shortcuts.menu.expenses.shortcut,
		},
		{
			key: "investments",
			name: t("navigation.investments"),
			href: "/dashboard/investments",
			Icon: InvestmentIcon,
			shortcut: shortcuts.menu.investments.shortcut,
		},
		{
			key: "subscriptions",
			name: t("navigation.subscriptions"),
			href: "/dashboard/subscriptions",
			Icon: SubscriptionsIcon,
			shortcut: shortcuts.menu.subscriptions.shortcut,
		},
		{ key: "debts", name: "Hutang Piutang", href: "/dashboard/debts", Icon: DebtsIcon },
		{ key: "budgets", name: "Budgets", href: "/dashboard/budgets", Icon: BudgetsIcon },
		{ key: "goals", name: "Goals", href: "/dashboard/goals", Icon: GoalsIcon },
		{
			key: "accounts",
			name: t("navigation.accounts"),
			href: "/dashboard/accounts",
			Icon: WalletIcon,
			shortcut: shortcuts.menu.accounts?.shortcut,
		},
	];
	useHotkeys(
		menuShortcutList,
		(_, handler) => {
			const keys = handler.keys?.join("");
			if (keys === shortcuts.menu.overview.shortcut) router("/dashboard");
			if (keys === shortcuts.menu.income.shortcut) router("/dashboard/income");
			if (keys === shortcuts.menu.expenses.shortcut) router("/dashboard/expenses");
			if (keys === shortcuts.menu.investments.shortcut) router("/dashboard/investments");
			if (keys === shortcuts.menu.subscriptions.shortcut) router("/dashboard/subscriptions");
			if (keys === shortcuts.menu.profile.shortcut) router("/dashboard/profile");
		},
		options,
	);

	async function signOut() {
		await fetch("/api/auth/signout", { method: "POST" });
		window.location.href = "/signin";
	}

	return (
		<>
			<div
				onClick={closeSidebar}
				className={`fixed inset-0 left-0 right-0 z-1 hidden bg-black bg-opacity-10 backdrop-blur-sm ${cn({
					"block!": show,
				})}`}
			/>
			<nav
				className={`fixed bottom-0 left-0 top-0 z-1 hidden min-h-full w-[70px] flex-col bg-[#09090b] px-3 py-2 transition-all sm:flex sm:w-[64px] sm:dark:border-r sm:dark:border-border ${cn(
					{ "block!": show },
				)}`}
			>
				<div className="z-10 mb-[10px] flex h-full w-full flex-col justify-between">
					<div className="flex h-full flex-col items-center justify-between">
						<div className="flex flex-col items-center">
							<Link
								onClick={closeSidebar}
								to="/dashboard"
								className="mt-[3px] active:scale-95 rounded-lg p-1 transition-all focus:outline-hidden"
							>
								<img className="block" src="/icons/logo.png" width={30} height={30} alt="Dompetku" />
							</Link>
							<Separator className="mb-2 mt-[8px] border-t border-gray-100 opacity-[0.2]" />
							{navItems.map((link, index) => {
								return (
									<SidebarLink
										className={index === 0 ? "mt-0!" : ""}
										onClick={closeSidebar}
										key={link.key}
										name={link.name}
										active={pathname === link.href}
										href={link.href}
										shortcut={link.shortcut}
									>
										<link.Icon className="text-white" />
									</SidebarLink>
								);
							})}
							{user?.role === "ADMIN" && (
								<SidebarLink
									onClick={closeSidebar}
									name="Admin Panel"
									active={pathname.startsWith("/admin")}
									href="/admin"
								>
									<SettingsIcon className="text-white" />
								</SidebarLink>
							)}
						</div>
						<div className="flex flex-col items-center">
							{settingsLinks.map((link) => {
								return (
									<SidebarLink onClick={closeSidebar} key={link.href} active={pathname === link.href} href={link.href}>
										<link.Icon className="text-white" />
									</SidebarLink>
								);
							})}
							<button
								className={`mt-2 flex h-[40px] w-full items-center justify-center rounded-lg p-2 text-base tracking-wide text-white hover:bg-[#27272a]`}
								onClick={signOut}
								title={t("common.logout")}
							>
								<div className="flex items-center">
									<SignoutIcon className="text-white" />
								</div>
							</button>
						</div>
					</div>
				</div>
			</nav>
		</>
	);
}
