import { I18nProvider } from "@i18n/provider";
import { getLocaleFromRequest, loadTranslations } from "@i18n/server";
import type { LoaderFunctionArgs } from "@remix-run/cloudflare";
import { useLoaderData } from "@remix-run/react";
import SignInView from "~/features/auth/components/signin-view";

export const loader = async ({ request }: LoaderFunctionArgs) => {
	const locale = getLocaleFromRequest(request);
	const translations = await loadTranslations(locale);
	return { locale, translations };
};

export default function SignIn() {
	const { locale, translations } = useLoaderData<typeof loader>();

	return (
		<I18nProvider locale={locale} translations={translations}>
			<SignInView />
		</I18nProvider>
	);
}
