import type { LinksFunction, MetaFunction } from '@remix-run/cloudflare';
import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from '@remix-run/react';

import { GA4_ANALYTICS_ID } from '~/env';

import '../globals.css';
import '../overwrites.css';

export const meta: MetaFunction = () => [
  { title: 'Dompetku - Track your expenses with ease' },
  { name: 'description', content: 'Effortlessly Track and Manage Expenses.' },
];

export const links: LinksFunction = () => [
  { rel: 'manifest', href: 'https://dompetku/manifest.json' },
  { rel: 'icon', href: '/favicon.ico' },
  { rel: 'apple-touch-icon', href: 'https://dompetku/icons/apple-icon.png' },
];

export default function App() {
  return (
    <html lang="en">
      <head>
        <Meta />
        <Links />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${GA4_ANALYTICS_ID}');
            `,
          }}
        />
        <script src={`https://www.googletagmanager.com/gtag/js?id=${GA4_ANALYTICS_ID}`} />
      </head>
      <body className="flex h-full flex-col text-gray-600 antialiased">
        <Outlet />
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}