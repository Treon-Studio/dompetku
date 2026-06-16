import { I18nProvider } from "@i18n/provider";
import { getLocaleFromRequest, loadTranslations } from "@i18n/server";
import type { LoaderFunctionArgs, MetaFunction } from "@remix-run/cloudflare";
import { json } from "@remix-run/cloudflare";
import { useLoaderData } from "@remix-run/react";
import ProfileView from "~/features/profile/components/profile-view";
import LayoutHeader from "~/shared/components/layout/header";

export const meta: MetaFunction = () => {
	return [{ title: "Dompetku - Profile" }, { name: "description", content: "Manage your account and preferences." }];
};

export async function loader({ request }: LoaderFunctionArgs) {
	const locale = getLocaleFromRequest(request);
	const translations = await loadTranslations(locale);
	return json({ locale, translations });
}

export default function ProfileRoute() {
	const { locale, translations } = useLoaderData<typeof loader>();

	return (
		<I18nProvider locale={locale} translations={translations}>
			<>
				<LayoutHeader title="profile" />
				<ProfileView />
			</>
		</I18nProvider>
	);
}
