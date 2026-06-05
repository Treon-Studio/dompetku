import { Link, useLoaderData } from '@remix-run/react';

import Footer from '~/shared/components/footer';
import Features from '~/shared/components/home/features';

import url from '~/shared/constants/url';
import { redirect, type LoaderFunctionArgs } from '@remix-run/cloudflare';
import { getUserFromSession } from '~/features/auth/api.server';
import { createDbClient } from '~/core/db.server';
import { premiumPlan } from '~/shared/constants/usage';
import { getLocaleFromRequest, loadTranslations } from '@i18n/server';
import { I18nProvider } from '@i18n/provider';
import { useTranslation } from '@i18n/client';

export const loader = async ({ request, context }: LoaderFunctionArgs) => {
  const db = createDbClient(context.cloudflare.env);
  const user = await getUserFromSession(request, db, context);
  if (user) {
    return redirect('/dashboard');
  }
  const locale = getLocaleFromRequest(request);
  const translations = await loadTranslations(locale);
  return { locale, translations };
};

export const meta = () => [
	{ title: 'Dompetku - Track your expenses with ease' },
	{ name: 'description', content: 'Effortlessly Track and Manage Expenses.' },
	{ property: 'og:title', content: 'Dompetku - Track your expenses with ease' },
	{ property: 'og:description', content: 'Effortlessly Track and Manage Expenses.' },
	{ property: 'og:type', content: 'website' },
	{ name: 'twitter:card', content: 'summary_large_image' },
];

export default function Home() {
  const { locale, translations } = useLoaderData<typeof loader>();
  const { t } = useTranslation();

  return (
    <I18nProvider locale={locale} translations={translations}>
    <div className="relative h-full bg-linear-to-br from-sky-100 via-white to-sky-100 pl-2 pr-2 text-gray-800">
      <header className="relative m-auto h-[56px] max-w-4xl pt-3">
        <div className="absolute left-0 right-0 top-3 z-20 flex items-center justify-between">
          <Link to={'/'} className="flex max-w-[180px] items-center p-3 text-2xl">
            <img src="/icons/logo.png" width={30} height={30} alt="dompetku logo" className="mr-2" />
            <span className="font-black tracking-[-0.03em] text-gray-900">Dompetku</span>
          </Link>
          <Link
            to={url.app.signin}
            className="leading-2 mr-4 inline-flex h-[34px] items-center overflow-hidden rounded-full bg-gray-900 px-4 py-1 text-sm font-medium text-white transition hover:bg-primary/90"
          >
            {t('common.signin')}
          </Link>
        </div>
      </header>
      <main>
        <div className="absolute inset-x-0 top-[-55px] z-10 h-96 overflow-hidden text-gray-900/40 opacity-10 mask-[linear-gradient(to_top,transparent,white)]">
          <svg className="absolute inset-0 top-0 h-full w-full text-gray-900" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern
                id="pattern"
                width="32"
                height="32"
                patternUnits="userSpaceOnUse"
                x="50%"
                y="100%"
                patternTransform="translate(0 -1)"
              >
                <path d="M0 32V.5H32" fill="none" stroke="currentColor"></path>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#pattern)"></rect>
          </svg>
        </div>
        <div className="mx-auto mb-16 mt-16 max-w-md px-3 text-center sm:max-w-lg sm:px-0">
          <h1 className="mt-4	text-4xl font-black leading-[1.15] tracking-[-0.03em] text-black sm:text-5xl sm:leading-[1.15]">
            Effortlessly Track and Manage{' '}
            <span className="bg-linear-to-r from-amber-400 to-orange-600 bg-clip-text text-transparent">
              Expenses.
            </span>
          </h1>
          <p className="mt-5 text-base font-normal leading-6 tracking-tight sm:text-lg">
            Our easy-to-use platform allows you to track and categorize your spending, giving you a clear picture of
            your financials.
          </p>
          <div className="mt-10 flex justify-center">
            <Link
              to={url.app.signup}
              className="inline-flex h-[34px] items-center justify-center rounded-full bg-gray-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-primary/90 hover:shadow-sm"
            >
              {t('common.signup')}
            </Link>
            <Link
              to={url.github}
              className="ml-6 inline-flex h-[34px] items-center justify-center  rounded-full bg-white/0 px-4 py-2.5 text-sm font-medium text-slate-900 ring-1 ring-slate-900/10 hover:bg-gray-100 hover:shadow-sm"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                className="mr-2"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"></path>
              </svg>
              Star on GitHub
            </Link>
          </div>
        </div>
        <div className="mx-auto mb-16 mt-16 max-w-md px-3 text-center sm:max-w-lg sm:px-0">
          <h2 className="mt-4 text-3xl font-extrabold tracking-[-0.03em] text-black sm:text-4xl">
            <span className="bg-linear-to-r from-amber-400 to-orange-600 bg-clip-text text-transparent">Why to use</span>{' '}
            Dompetku?
          </h2>
          <ul className="mt-6 list-decimal px-4 text-left leading-6 [counter-reset:section] sm:px-2">
            <li className="before::h-2 mt-4 text-base tracking-tight sm:text-lg">
              <b className="font-sans font-bold text-black">Easy to use:</b> Track expenses on-the-go with
              categorization and logging.
            </li>
            <li className="before::h-2 mt-4 text-base tracking-tight sm:text-lg">
              <b className="font-sans font-bold text-black">Data-driven insights:</b> Expense tracker can provide
              valuable insights into your spending habits, allowing you to make more informed decisions.
            </li>
            <li className="before::h-2 mt-4 text-base tracking-tight sm:text-lg">
              <b className="font-sans font-bold text-black">Identify overspending:</b> Take control of your finances by
              identifying and reducing overspending with an expense tracker.
            </li>
            <li className="before::h-2 mt-4 text-base tracking-tight sm:text-lg">
              <b className="font-sans font-bold text-black">Real-time visibility:</b> Monitor your expenses in
              real-time, whether you are at home or on-the-go, with a user-friendly interface
            </li>
          </ul>
        </div>
        <div className="mx-auto mb-16 mt-16 max-w-2xl">
          <h2 className="mb-12 mt-8 text-center text-3xl font-extrabold tracking-[-0.03em] text-black sm:text-4xl">
            Simple yet,{' '}
            <span className="bg-linear-to-r from-amber-400 to-orange-600 bg-clip-text text-transparent">Powerful</span>{' '}
            Features.
          </h2>
          <div className="mt-10 grid grid-cols-1 justify-center gap-10 p-5 lg:grid-cols-2 lg:gap-20">
            <Features />
          </div>
        </div>
        <div className="mx-auto mb-16 mt-16 grid max-w-md justify-center px-3 text-center sm:px-0 md:max-w-[600px]">
          <h2 className="mt-0 text-3xl font-extrabold tracking-[-0.03em] text-black sm:text-4xl">
            Our{' '}
            <span className="bg-linear-to-r from-amber-400 to-orange-600 bg-clip-text text-transparent">Pricing Plans</span>
          </h2>
          <p className="mt-3 text-base leading-7 tracking-tight sm:text-lg">Start for free, no credit card is required.</p>
          <div className="mt-8 flex w-full flex-col sm:flex-row">
            <div className="min-w-[330px] divide-y divide-gray-600 rounded-lg bg-zinc-900 text-left shadow-xs sm:mr-8">
              <div className="p-5 py-6">
                <h2 className="text-3xl font-extrabold leading-6 text-white">Basic</h2>
                <p className="mb-2 mt-2 text-gray-300">Free forever with limits.</p>
                <p className="mt-4">
                  <span className="text-3xl font-extrabold text-white">$ 0</span>
                  <span className="text-base  text-gray-100"> / month</span>
                </p>
                <div className="mb-0 ml-1 mt-4 flex flex-col justify-center text-left text-white ">
                  <span className="m-1 ml-0 flex items-center  text-[15px]">Trend visualisation with charts</span>
                  <span className="m-1 ml-0 flex items-center text-[15px]">Add up to 100 entries per account</span>
                  <span className="m-1 ml-0 flex items-center text-[15px]">Track subscription billing dates</span>
                  <span className="m-1 ml-0 flex items-center text-[15px]">Choose preferred currency display</span>
                  <span className="m-1 ml-0 flex items-center text-[15px]">Email support available</span>
                </div>
                <Link
                  className="mt-10 block w-full rounded-md bg-white py-2 text-center text-sm font-semibold text-black hover:bg-gray-200"
                  to={url.app.signup}
                >
                  Start for free
                </Link>
              </div>
            </div>
            <div className="bg-pro-plan mt-8  min-w-[330px] divide-y divide-gray-600 rounded-lg bg-zinc-900 text-left shadow-xs sm:mt-0">
              <div className="p-5 py-6">
                <h2 className="text-3xl font-extrabold leading-6 text-white">Premium</h2>
                <p className="mb-2 mt-2 text-gray-300">Access to all premium features.</p>
                <p className="mt-4">
                  <span className="inline-flex text-3xl font-extrabold text-white">$ 20</span>
                  <span className="text-base text-gray-100"> / year</span>
                </p>
                <div className="mb-0 ml-1 mt-4 flex flex-col justify-center text-left text-white ">
                  <span className="m-1 ml-0 flex items-center  text-[15px]">Everything in Basic plan</span>
                  <span className="m-1 ml-0 flex items-center text-[15px]">Add up to {premiumPlan.limit} entries per account</span>
                  <span className="m-1 ml-0 flex items-center text-[15px]">Advanced trend visualisation</span>
                  <span className="m-1 ml-0 flex items-center text-[15px]">Export data as CSV</span>
                  <span className="m-1 ml-0 flex items-center text-[15px]">Priority support with quick reply</span>
                </div>
                <Link
                  className="mt-10 flex w-full justify-center rounded-md bg-white py-2 text-center text-sm font-semibold text-black hover:bg-gray-200"
                  to={url.app.signup}
                >
                  Get started
                </Link>
              </div>
            </div>
          </div>
        </div>
        <div className="mx-auto mb-16 mt-16 max-w-md px-3 text-center sm:max-w-lg sm:px-0">
          <h2 className="mt-4 text-3xl font-extrabold tracking-[-0.03em] text-black sm:text-4xl sm:leading-14">
            Proudly{' '}
            <span className="bg-linear-to-r from-blue-400 to-sky-600 bg-clip-text text-transparent">Open Sourced!</span>
          </h2>
          <p className="mt-3 text-base leading-7 sm:text-lg">
            Source code is available on GitHub - feel free to read, review, or contribute to it!
          </p>
          <Link
            to={url.github}
            className="mt-6 inline-flex h-[36px] items-center justify-center  rounded-full bg-white/0 px-4 py-2.5 text-sm font-medium text-slate-900 ring-1 ring-slate-900/10 hover:bg-gray-100 hover:shadow-sm"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              className="mr-2"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"></path>
            </svg>
            Star on GitHub
          </Link>
        </div>
      </main>
      <Footer />
    </div>
    </I18nProvider>
  );
}