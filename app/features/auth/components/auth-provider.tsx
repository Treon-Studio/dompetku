import { createContext, useContext } from 'react';

interface User {
	currency: string;
	locale: string;
	billing_start_date: string | null;
	trial_start_date: string | null;
	order_status: string | null;
	usage: number;
	email: string | null;
	phone: string | null;
	plan_status: string;
	new_signup_email: boolean;
	basic_usage_limit_email: boolean;
	premium_plan_expired_email: boolean;
	premium_usage_limit_email: boolean;
	monthly_email_report: boolean;
	isPremium: boolean;
	isPremiumPlanEnded: boolean;
	role: string;
}

interface Session {}

interface AuthContextValue {
	user: User;
	signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export const AuthProvider = ({ user, children }: { user: User; children: React.ReactNode }) => {
	const value = {
		user,
		signOut: async () => {
			await fetch('/api/auth/signout', { method: 'POST' });
			window.location.href = '/signin';
		},
	};

	return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useUser = () => {
	const context = useContext(AuthContext);
	if (context === undefined) {
		throw new Error(`useUser must be used within a AuthContext.`);
	}
	return context?.user ?? null;
};
