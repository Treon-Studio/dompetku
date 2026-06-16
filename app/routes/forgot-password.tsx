import { I18nProvider } from "@i18n/provider";
import { getLocaleFromRequest, loadTranslations } from "@i18n/server";
import type { LoaderFunctionArgs } from "@remix-run/cloudflare";
import { useLoaderData } from "@remix-run/react";
import ForgotPasswordView from "~/features/auth/components/forgot-password-view";

export const loader = async ({ request }: LoaderFunctionArgs) => {
	const locale = getLocaleFromRequest(request);
	const translations = await loadTranslations(locale);
	return { locale, translations };
};

export default function ForgotPassword() {
	const { locale, translations } = useLoaderData<typeof loader>();

	return (
		<I18nProvider locale={locale} translations={translations}>
			<ForgotPasswordView />
		</I18nProvider>
	);
}
