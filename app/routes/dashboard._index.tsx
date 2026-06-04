import type { LoaderFunctionArgs, MetaFunction } from '@remix-run/cloudflare';
import { json } from '@remix-run/cloudflare';
import { useLoaderData } from '@remix-run/react';

import { OverviewContextProvider } from '~/shared/components/context/overview-provider';
import LayoutHeader from '~/shared/components/layout/header';
import Summary from '~/shared/components/dashboard/summary';
import Charts from '~/shared/components/dashboard/charts';
import AddData from '~/shared/components/dashboard/add-data';
import { getLocaleFromRequest, loadTranslations } from '@i18n/server';
import { I18nProvider } from '@i18n/provider';

export const meta: MetaFunction = () => {
  return [{ title: 'Dompetku - Overview' }];
};

export async function loader({ request }: LoaderFunctionArgs) {
  const locale = getLocaleFromRequest(request);
  const translations = await loadTranslations(locale);
  return json({ locale, translations });
}

export default function DashboardIndex() {
  const { locale, translations } = useLoaderData<typeof loader>();

  return (
    <I18nProvider locale={locale} translations={translations}>
      <OverviewContextProvider>
        <LayoutHeader title="overview" showDatePicker={true} />
        <div className="p-4 pt-3">
          <Summary />
          <h2 className="mb-4 mt-4 font-semibold text-primary dark:text-white">Reports</h2>
          <div className="mb-8 grid grid-cols-1 gap-1 md:gap-8 lg:grid-cols-2">
            <Charts />
          </div>
        </div>
        <AddData />
      </OverviewContextProvider>
    </I18nProvider>
  );
}
