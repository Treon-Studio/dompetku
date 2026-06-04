import { useLoaderData } from '@remix-run/react';
import { type LoaderFunctionArgs } from '@remix-run/cloudflare';
import { getLocaleFromRequest, loadTranslations } from '@i18n/server';
import { I18nProvider } from '@i18n/provider';
import SignUpView from '~/features/auth/components/signup-view';

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const locale = getLocaleFromRequest(request);
  const translations = await loadTranslations(locale);
  return { locale, translations };
};

export default function SignUp() {
  const { locale, translations } = useLoaderData<typeof loader>();

  return (
    <I18nProvider locale={locale} translations={translations}>
      <SignUpView />
    </I18nProvider>
  );
}