import type { LoaderFunctionArgs, MetaFunction } from '@remix-run/node';
import { json } from '@remix-run/node';
import { useLoaderData } from '@remix-run/react';

import { DataContextProvider } from '~/components/context/data-provider';
import LayoutHeader from '~/components/layout/header';
import ExpensesSummary from '~/components/dashboard/expenses/summary';
import ExpenseTable from '~/components/dashboard/expenses/table';
import { getLocaleFromRequest, loadTranslations } from '@i18n/server';
import { I18nProvider } from '@i18n/provider';

export const meta: MetaFunction = () => {
  return [
    { title: 'Dompetku – Expenses' },
    { name: 'description', content: 'Effortlessly Track and Manage Expenses.' },
  ];
};

export async function loader({ request }: LoaderFunctionArgs) {
  const locale = getLocaleFromRequest(request);
  const translations = await loadTranslations(locale);
  return json({ locale, translations });
}

export default function ExpensesPage() {
  const { locale, translations } = useLoaderData<typeof loader>();

  return (
    <I18nProvider locale={locale} translations={translations}>
    <>
      <LayoutHeader title="expenses" />
      <DataContextProvider name="expenses">
        <div className="w-full overflow-x-auto p-4 pt-3">
          <ExpensesSummary />
          <ExpenseTable />
        </div>
      </DataContextProvider>
    </>
    </I18nProvider>
  );
}