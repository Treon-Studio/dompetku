import type { MetaFunction } from "@remix-run/cloudflare";
import AccountsView from "~/features/accounts/components/accounts-view";

export const meta: MetaFunction = () => {
	return [{ title: "Dompetku - Rekening Saya" }];
};

export default function AccountsPage() {
	return <AccountsView />;
}