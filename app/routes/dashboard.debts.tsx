import { I18nProvider } from "@i18n/provider";
import { getLocaleFromRequest, loadTranslations } from "@i18n/server";
import type { LoaderFunctionArgs, MetaFunction } from "@remix-run/cloudflare";
import { json } from "@remix-run/cloudflare";
import { useLoaderData } from "@remix-run/react";

import DebtsView from "~/features/debts/components/debts-view";

export const meta: MetaFunction = () => {
	return [
		{ title: "Dompetku - Debts (Hutang / Piutang)" },
		{ name: "description", content: "Track debts with your friends." },
	];
};

export async function loader({ request }: LoaderFunctionArgs) {
	const locale = getLocaleFromRequest(request);
	const translations = await loadTranslations(locale);
	return json({ locale, translations });
}

export default function DebtsPage() {
	const { locale, translations } = useLoaderData<typeof loader>();

	return (
		<I18nProvider locale={locale} translations={translations}>
			<DebtsView />
		</I18nProvider>
	);
}
