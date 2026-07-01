import {
	BillList,
	CalendarMinimalistic,
	ChatRoundDots,
	GraphUp,
	Logout,
	Settings,
	UserCircle,
	UsersGroupTwoRounded,
	Wallet,
	WalletMoney,
	Widget5,
} from "@solar-icons/react";

export const OverviewIcon = ({ className }: { className?: string }) => <Widget5 className={className} />;
export const ExpensesIcon = ({ className }: { className?: string }) => <BillList className={className} />;
export const IncomeIcon = ({ className }: { className?: string }) => <WalletMoney className={className} />;
export const SubscriptionsIcon = ({ className }: { className?: string }) => (
	<CalendarMinimalistic className={className} />
);
export const SettingsIcon = ({ className }: { className?: string }) => <Settings className={className} />;
export const SupportIcon = ({ className }: { className?: string }) => <ChatRoundDots className={className} />;
export const InvestmentIcon = ({ className }: { className?: string }) => <GraphUp className={className} />;
export const SignoutIcon = ({ className }: { className?: string }) => <Logout className={className} />;
export const ProfileIcon = ({ className }: { className?: string }) => <UserCircle className={className} />;
export const DebtsIcon = ({ className }: { className?: string }) => <UsersGroupTwoRounded className={className} />;
export const BudgetsIcon = ({ className }: { className?: string }) => <BillList className={className} />;
export const GoalsIcon = ({ className }: { className?: string }) => <GraphUp className={className} />;
export const WalletIcon = ({ className }: { className?: string }) => <Wallet className={className} />;
