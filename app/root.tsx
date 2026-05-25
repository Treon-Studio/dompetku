import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLoaderData,
  isRouteErrorResponse,
  useRouteError,
  Link,
} from '@remix-run/react';
import type { LinksFunction, MetaFunction, LoaderFunctionArgs } from '@remix-run/cloudflare';

import { getCloudflareEnv } from '~/env';
import { getLocaleFromRequest, loadTranslations } from '@i18n/server';
import { I18nProvider } from '@i18n/provider';

import './globals.css';
import './overwrites.css';

export const loader = async ({ request, context }: LoaderFunctionArgs) => {
  const env = getCloudflareEnv(context);
  const locale = getLocaleFromRequest(request);
  const translations = await loadTranslations(locale);
  return {
    ENV: {
      GA4_ANALYTICS_ID: env.GA4_ANALYTICS_ID,
    },
    locale,
    translations,
  };
};

export const meta: MetaFunction = () => [
  { title: 'Dompetku - Track your expenses with ease' },
  { name: 'description', content: 'Effortlessly Track and Manage Expenses.' },
];

export const links: LinksFunction = () => [
  { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
  { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossOrigin: 'anonymous' },
  { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=Inter:wght@100..900&display=swap' },
  { rel: 'manifest', href: '/manifest.json' },
  { rel: 'icon', href: '/icons/icon.svg' },
  { rel: 'apple-touch-icon', href: '/icons/apple-icon.png' },
];

export default function App() {
  const data = useLoaderData<typeof loader>();
  const gaId = data?.ENV?.GA4_ANALYTICS_ID || '';

  return (
    <I18nProvider locale={data.locale} translations={data.translations}>
    <html lang="en" suppressHydrationWarning>
      <head suppressHydrationWarning>
        <meta charSet="utf-8" />
        <Meta />
        <Links />
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('theme');if(t==='dark'||((!t||t==='system')&&matchMedia('(prefers-color-scheme:dark)').matches))document.documentElement.classList.add('dark');else document.documentElement.classList.add('light')}catch(e){}})()`,
          }}
        />
        {gaId && (
          <>
            <script
              dangerouslySetInnerHTML={{
                __html: `
                  window.dataLayer = window.dataLayer || [];
                  function gtag(){dataLayer.push(arguments);}
                  gtag('js', new Date());
                  gtag('config', '${gaId}');
                `,
              }}
            />
            <script src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`} />
          </>
        )}
      </head>
      <body className="flex h-full flex-col text-gray-600 antialiased" suppressHydrationWarning>
        <Outlet />
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
    </I18nProvider>
  );
}

export function ErrorBoundary() {
  const error = useRouteError();

  let heading = 'Something went wrong';
  let message = 'An unexpected error occurred.';

  if (isRouteErrorResponse(error)) {
    if (error.status === 404) {
      heading = 'Page not found';
      message = 'Oops! The page you are looking for does not exist.';
    } else {
      heading = `${error.status} Error`;
      message = error.data || error.statusText;
    }
  }

  return (
    <html lang="en">
      <head>
        <title>{heading} - Dompetku</title>
        <Links />
      </head>
      <body className="flex h-full flex-col text-gray-600 antialiased">
        <div className="flex min-h-screen flex-col items-center justify-center bg-sky-50 px-4 text-center">
          <h1 className="mb-4 text-6xl font-extrabold text-gray-900">{heading}</h1>
          <p className="mb-8 text-xl text-gray-600">{message}</p>
          <a
            href="/"
            className="inline-flex h-12 items-center justify-center rounded-md bg-gray-900 px-8 text-sm font-medium text-white transition-colors hover:bg-gray-800"
          >
            Go back home
          </a>
        </div>
        <Scripts />
      </body>
    </html>
  );
}