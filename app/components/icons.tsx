import {
  Widget5,
  BillList,
  WalletMoney,
  CalendarMinimalistic,
  Settings,
  ChatRoundDots,
  GraphUp,
  Logout,
  UserCircle,
} from '@solar-icons/react';

export const OverviewIcon = ({ className }: { className?: string }) => <Widget5 className={className} />;
export const ExpensesIcon = ({ className }: { className?: string }) => <BillList className={className} />;
export const IncomeIcon = ({ className }: { className?: string }) => <WalletMoney className={className} />;
export const SubscriptionsIcon = ({ className }: { className?: string }) => <CalendarMinimalistic className={className} />;
export const SettingsIcon = ({ className }: { className?: string }) => <Settings className={className} />;
export const SupportIcon = ({ className }: { className?: string }) => <ChatRoundDots className={className} />;
export const InvestmentIcon = ({ className }: { className?: string }) => <GraphUp className={className} />;
export const SignoutIcon = ({ className }: { className?: string }) => <Logout className={className} />;
export const ProfileIcon = ({ className }: { className?: string }) => <UserCircle className={className} />;
