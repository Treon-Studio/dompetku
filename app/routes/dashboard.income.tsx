import type { LoaderFunctionArgs, MetaFunction } from '@remix-run/cloudflare';
import { json } from '@remix-run/cloudflare';
import { useLoaderData } from '@remix-run/react';

import { DataContextProvider } from '~/shared/components/context/data-provider';
import LayoutHeader from '~/shared/components/layout/header';
import IncomeSummary from '~/features/income/components/summary';
import IncomeTable from '~/features/income/components/table';
import { getLocaleFromRequest, loadTranslations } from '@i18n/server';
import { I18nProvider } from '@i18n/provider';

export const meta: MetaFunction = () => {
  return [
    { title: 'Dompetku - Income' },
    { name: 'description', content: 'Effortlessly Track and Manage Income.' },
  ];
};

export async function loader({ request }: LoaderFunctionArgs) {
  const locale = getLocaleFromRequest(request);
  const translations = await loadTranslations(locale);
  return json({ locale, translations });
}

export default function IncomePage() {
  const { locale, translations } = useLoaderData<typeof loader>();

  return (
    <I18nProvider locale={locale} translations={translations}>
    <>
      <LayoutHeader title="income" />
      <DataContextProvider name="income">
        <div className="w-full overflow-x-auto p-4 pt-3">
          <IncomeSummary />
          <IncomeTable />
        </div>
      </DataContextProvider>
    </>
    </I18nProvider>
  );
}
