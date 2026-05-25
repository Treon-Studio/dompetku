import { Link, useLoaderData } from '@remix-run/react';
import { useEffect, useState } from 'react';

import Footer from '~/components/footer';

import SignInForm from './signin.form';
import { type LoaderFunctionArgs } from '@remix-run/node';
import { getLocaleFromRequest, loadTranslations } from '@i18n/server';
import { I18nProvider } from '@i18n/provider';

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const locale = getLocaleFromRequest(request);
  const translations = await loadTranslations(locale);
  return { locale, translations };
};

function CsrIndicator() {
	const [hydrated, setHydrated] = useState(false);

	useEffect(() => {
		// This only runs on the client after React hydration
		setHydrated(true);
	}, []);

	return (
		<div
			style={{
				position: 'fixed',
				bottom: '16px',
				left: '16px',
				zIndex: 9999,
				display: 'flex',
				alignItems: 'center',
				gap: '6px',
				padding: '6px 10px',
				borderRadius: '9999px',
				fontSize: '11px',
				fontFamily: 'monospace',
				fontWeight: 600,
				backgroundColor: hydrated ? '#dcfce7' : '#f3f4f6',
				color: hydrated ? '#15803d' : '#6b7280',
				border: `1px solid ${hydrated ? '#86efac' : '#d1d5db'}`,
				boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
				transition: 'all 0.3s ease',
				userSelect: 'none',
			}}
		>
			<span
				style={{
					width: '7px',
					height: '7px',
					borderRadius: '50%',
					backgroundColor: hydrated ? '#22c55e' : '#9ca3af',
					flexShrink: 0,
					animation: hydrated ? 'pulse 2s infinite' : 'none',
				}}
			/>
			{hydrated ? '⚡ React CSR Active' : '⏳ SSR Only'}
			<style>{`
				@keyframes pulse {
					0%, 100% { opacity: 1; }
					50% { opacity: 0.4; }
				}
			`}</style>
		</div>
	);
}

export default function SignIn() {
  const { locale, translations } = useLoaderData<typeof loader>();

  return (
    <I18nProvider locale={locale} translations={translations}>
    <main
      className={`relative m-auto flex h-screen w-full flex-col items-center justify-center bg-linear-to-br from-sky-100 via-white to-sky-50 pl-2 pr-2`}
    >
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
      <div className="absolute z-50 m-auto flex w-[380px] flex-1 flex-col justify-center p-6 sm:w-[468px] sm:p-10">
        <Link to="https://dompetku">
          <h1 className="flex flex-col items-center text-3xl">
            <img className="active:scale-95" src="/icons/logo.svg" width={50} height={50} alt="dompetku logo" />
            <span className="mt-2 font-black text-gray-900">Dompetku</span>
          </h1>
        </Link>
        <p className="mb-6 mt-3 text-center text-sm font-medium text-zinc-600">
          Use your email address to securely sign in.
        </p>
        <SignInForm />
      </div>
      <Footer className={'absolute bottom-0'} />
      <CsrIndicator />
    </main>
    </I18nProvider>
  );
}