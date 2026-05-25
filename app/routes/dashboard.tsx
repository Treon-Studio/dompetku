import type { LoaderFunctionArgs, MetaFunction } from '@remix-run/node';
import { json } from '@remix-run/node';
import { Outlet, useLoaderData } from '@remix-run/react';
import { addYears } from 'date-fns';

import { AuthProvider } from '~/components/context/auth-provider';
import { SidebarContextProvider } from '~/components/context/sidebar-provider';
import { ThemeProvider } from '~/components/context/theme-provider';
import DashboardLayout from '~/components/layout';
import Sidebar from '~/components/sidebar';
import { Toaster } from '~/components/ui/sonner';
import prisma from '~/lib/prisma';
import { requireUser } from '~/lib/auth.server';
import { getLocaleFromRequest, loadTranslations } from '@i18n/server';
import { I18nProvider } from '@i18n/provider';

import { GA4_ANALYTICS_ID } from '~/env';

export const meta: MetaFunction = () => {
  return [
    { title: 'Dompetku – Overview' },
    { name: 'description', content: 'Effortlessly Track and Manage Expenses.' },
  ];
};

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await requireUser(request);

  const isPremiumPlan = user.order_status === 'paid' && user.plan_status === 'premium';
  const isPremiumPlanEnded =
    isPremiumPlan && user.billing_start_date && new Date() > addYears(new Date(user.billing_start_date), 1);
  const isPremium = isPremiumPlan && !isPremiumPlanEnded;

  const locale = getLocaleFromRequest(request);
  const translations = await loadTranslations(locale);

  return json({
    user: { ...user, isPremium, isPremiumPlanEnded: !!isPremiumPlanEnded },
    locale,
    translations,
  });
}

export default function DashboardLayoutRoute() {
  const { user, locale, translations } = useLoaderData<typeof loader>();

  return (
    <I18nProvider locale={locale} translations={translations}>
    <>
      <AuthProvider user={user}>
        <ThemeProvider>
          <main className="relative flex min-h-full min-w-full bg-background">
            <DashboardLayout>
              <SidebarContextProvider>
                <Sidebar />
                <div className="h-full w-full sm:ml-[64px]">
                  <div className="flex h-full w-full flex-col max-sm:ml-0"><Outlet /></div>
                </div>
              </SidebarContextProvider>
            </DashboardLayout>
          </main>
          <Toaster closeButton position="top-right" theme="system" visibleToasts={3} richColors />
        </ThemeProvider>
      </AuthProvider>
    </>
    </I18nProvider>
  );
}