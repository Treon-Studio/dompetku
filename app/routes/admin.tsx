import type { LoaderFunctionArgs, MetaFunction } from '@remix-run/cloudflare';
import { json } from '@remix-run/cloudflare';
import { Outlet, useLoaderData } from '@remix-run/react';
import { addYears } from 'date-fns';

import { AuthProvider } from '~/components/context/auth-provider';
import { ThemeSync } from '~/stores/ui/theme-sync';
import DashboardLayout from '~/components/layout';
import Sidebar from '~/components/sidebar';
import { Toaster } from '~/components/ui/sonner';
import { createPrismaClient } from '~/lib/prisma';
import { requireAdmin } from '~/lib/auth.server';
import { getLocaleFromRequest, loadTranslations } from '@i18n/server';
import { I18nProvider } from '@i18n/provider';

export const meta: MetaFunction = () => {
  return [
    { title: 'Dompetku - Admin Panel' },
    { name: 'description', content: 'Super Admin Dashboard' },
  ];
};

export async function loader({ request, context }: LoaderFunctionArgs) {
  const db = createPrismaClient(context.cloudflare.env);
  const user = await requireAdmin(request, db, context);

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

export default function AdminLayoutRoute() {
  const { user, locale, translations } = useLoaderData<typeof loader>();

  return (
    <I18nProvider locale={locale} translations={translations}>
    <>
      <AuthProvider user={user}>
        <ThemeSync />
        <main className="relative flex min-h-full min-w-full bg-background">
          <DashboardLayout>
            <Sidebar />
            <div className="h-full w-full sm:ml-[64px]">
              <div className="flex h-full w-full flex-col max-sm:ml-0"><Outlet /></div>
            </div>
          </DashboardLayout>
        </main>
        <Toaster closeButton position="top-right" visibleToasts={3} richColors />
      </AuthProvider>
    </>
    </I18nProvider>
  );
}
