import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLoaderData,
  isRouteErrorResponse,
  useRouteError,
} from '@remix-run/react';
import type { LinksFunction, MetaFunction, LoaderFunctionArgs } from '@remix-run/cloudflare';

import { getCloudflareEnv } from '~/env';
import { getLocaleFromRequest, loadTranslations } from '@i18n/server';
import { I18nProvider } from '@i18n/provider';
import StateDisplay from '~/components/state-display';
import { logger } from '~/lib/logger';
import { initFirebase, logException } from '~/lib/firebase.client';

import './globals.css';
import './overwrites.css';

export const loader = async ({ request, context }: LoaderFunctionArgs) => {
  const env = getCloudflareEnv(context);
  const locale = getLocaleFromRequest(request);
  const translations = await loadTranslations(locale);

  if (env.FIREBASE_PROJECT_ID && env.FIREBASE_CLIENT_EMAIL && env.FIREBASE_PRIVATE_KEY) {
    const { configureLogger } = await import('~/lib/logger');
    configureLogger({
      projectId: env.FIREBASE_PROJECT_ID,
      clientEmail: env.FIREBASE_CLIENT_EMAIL,
      privateKey: env.FIREBASE_PRIVATE_KEY,
    });
  }

  return {
    ENV: {
      GA4_ANALYTICS_ID: env.GA4_ANALYTICS_ID,
      FIREBASE_API_KEY: env.FIREBASE_API_KEY,
      FIREBASE_AUTH_DOMAIN: env.FIREBASE_AUTH_DOMAIN,
      FIREBASE_PROJECT_ID: env.FIREBASE_PROJECT_ID,
      FIREBASE_STORAGE_BUCKET: env.FIREBASE_STORAGE_BUCKET,
      FIREBASE_MESSAGING_SENDER_ID: env.FIREBASE_MESSAGING_SENDER_ID,
      FIREBASE_APP_ID: env.FIREBASE_APP_ID,
      FIREBASE_MEASUREMENT_ID: env.FIREBASE_MEASUREMENT_ID,
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
  { rel: 'icon', href: '/favicon.ico' },
  { rel: 'apple-touch-icon', href: '/icons/apple-icon.png' },
];

export default function App() {
  const data = useLoaderData<typeof loader>();
  const gaId = data?.ENV?.GA4_ANALYTICS_ID || '';

  const fbConfig = data?.ENV;
  if (fbConfig?.FIREBASE_API_KEY && fbConfig?.FIREBASE_PROJECT_ID) {
    try {
      initFirebase({
        apiKey: fbConfig.FIREBASE_API_KEY!,
        authDomain: fbConfig.FIREBASE_AUTH_DOMAIN!,
        projectId: fbConfig.FIREBASE_PROJECT_ID!,
        storageBucket: fbConfig.FIREBASE_STORAGE_BUCKET!,
        messagingSenderId: fbConfig.FIREBASE_MESSAGING_SENDER_ID!,
        appId: fbConfig.FIREBASE_APP_ID!,
        measurementId: fbConfig.FIREBASE_MEASUREMENT_ID,
      });
    } catch {
      // firebase init failed
    }
  }

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
    logger.error(`Route error: ${heading}`, { status: error.status, message: String(message) });
  } else if (error instanceof Error) {
    logger.error('Unhandled error', { error: error.message, stack: error.stack });
  }

  logException(`${heading}: ${message}`, true);

  return (
    <html lang="en">
      <head>
        <title>{heading} - Dompetku</title>
        <Links />
      </head>
      <body className="flex h-full flex-col text-gray-600 antialiased">
        <div className="flex min-h-screen items-center justify-center px-4">
          <StateDisplay
            variant="error"
            title={heading}
            description={message}
            action={
              <a
                href="/"
                className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-6 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
              >
                Go back home
              </a>
            }
          />
        </div>
        <Scripts />
      </body>
    </html>
  );
}