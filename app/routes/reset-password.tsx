import { I18nProvider } from "@i18n/provider";
import { getLocaleFromRequest, loadTranslations } from "@i18n/server";
import { type LoaderFunctionArgs, redirect } from "@remix-run/cloudflare";
import { useLoaderData } from "@remix-run/react";
import ResetPasswordView from "~/features/auth/components/reset-password-view";

export const loader = async ({ request }: LoaderFunctionArgs) => {
	const urlObj = new URL(request.url);
	const token = urlObj.searchParams.get("token");
	if (!token) {
		return redirect("/forgot-password");
	}
	const locale = getLocaleFromRequest(request);
	const translations = await loadTranslations(locale);
	return { locale, translations, token };
};

export default function ResetPassword() {
	const { locale, translations, token } = useLoaderData<typeof loader>();

	return (
		<I18nProvider locale={locale} translations={translations}>
			<ResetPasswordView token={token} />
		</I18nProvider>
	);
}
