import {
	RiDashboardLine,
	RiBillLine,
	RiWallet3Line,
	RiCalendarCheckLine,
	RiSettings4Line,
	RiCustomerService2Line,
	RiLineChartLine,
	RiLogoutBoxRLine,
	RiUser3Line,
} from '@remixicon/react';

export const OverviewIcon = ({ className }: { className?: string }) => <RiDashboardLine className={className} />;
export const ExpensesIcon = ({ className }: { className?: string }) => <RiBillLine className={className} />;
export const IncomeIcon = ({ className }: { className?: string }) => <RiWallet3Line className={className} />;
export const SubscriptionsIcon = ({ className }: { className?: string }) => <RiCalendarCheckLine className={className} />;
export const SettingsIcon = ({ className }: { className?: string }) => <RiSettings4Line className={className} />;
export const SupportIcon = ({ className }: { className?: string }) => <RiCustomerService2Line className={className} />;
export const InvestmentIcon = ({ className }: { className?: string }) => <RiLineChartLine className={className} />;
export const SignoutIcon = ({ className }: { className?: string }) => <RiLogoutBoxRLine className={className} />;
export const ProfileIcon = ({ className }: { className?: string }) => <RiUser3Line className={className} />;
