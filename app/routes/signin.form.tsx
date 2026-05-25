import { Link } from '@remix-run/react';
import { useEffect, useRef, useState } from 'react';

import CircleLoader from '~/components/loader/circle';
import { Button } from '~/components/ui/button';

import { apiUrls } from '~/lib/apiUrls';

import url from '~/constants/url';
import { useTranslation } from '@i18n/client';

const initialState = { loading: false, email: '', password: '', success: false, error: '' };

export default function Form() {
  const { t } = useTranslation();
  const [state, setState] = useState(initialState);
  const inputElement = useRef<HTMLInputElement>(null);


	useEffect(() => {
		inputElement.current?.focus();
	}, []);

	const handleSignIn = async () => {
		setState((prev) => ({ ...prev, loading: true, error: '', success: false }));

		try {
			const res = await fetch(apiUrls.auth.signin, {
				method: 'POST',
				body: JSON.stringify({ email: state.email, password: state.password }),
				headers: { 'Content-Type': 'application/json' },
				redirect: 'manual', // Don't auto-follow the 302 — let the browser handle Set-Cookie
			});

			// Status 0 = opaque redirect (success from server)
			if (res.type === 'opaqueredirect' || res.ok) {
				window.location.href = '/dashboard'; // Full page reload to pick up the session cookie
				return;
			}

			const error = await res.json();
			throw new Error(error.message);
		} catch (error: any) {
			setState((prev) => ({ ...prev, error: error.message, loading: false }));
		}
	};

	return (
		<form
			className="grid w-full grid-cols-1 items-center gap-4 text-gray-800"
			onSubmit={(event) => {
				event.preventDefault();
				handleSignIn();
			}}
		>
			<label className="mb-1 block">
				<span className="mb-2 block text-sm font-semibold leading-6">{t('auth.email')}</span>
				<input
					className="mt-2 block h-10 w-full appearance-none rounded-md bg-white px-3 text-sm text-black shadow-xs ring-1 ring-gray-300 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-gray-900"
					autoFocus
					type="email"
					inputMode="email"
					autoComplete="email"
					placeholder="tim@apple.com"
					required
					value={state.email}
					onChange={(event) => {
						setState({ ...state, email: event.target.value });
					}}
					ref={inputElement}
				/>
			</label>
			<label className="mb-1 block">
				<span className="mb-2 block text-sm font-semibold leading-6">{t('auth.password')}</span>
				<input
					className="mt-2 block h-10 w-full appearance-none rounded-md bg-white px-3 text-sm text-black shadow-xs ring-1 ring-gray-300 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-gray-900"
					type="password"
					placeholder="••••••••"
					required
					value={state.password}
					onChange={(event) => {
						setState({ ...state, password: event.target.value });
					}}
				/>
			</label>
			<Button size={'lg'} type="submit" disabled={state.loading}>
				{state.loading ? <CircleLoader /> : t('auth.signin')}
			</Button>

			<p className="text-center text-sm font-medium text-gray-700">
				{t('auth.noAccount')}{' '}
				<Link
					to={url.app.signup}
					className="border-b border-gray-700 pb-px font-bold hover:border-gray-500 hover:text-gray-600"
				>
					{t('auth.signup')}
				</Link>
			</p>

			<p
				className={`mb-6 h-[50px] text-center text-sm font-medium ${
					(state.success && !state.error) || (!state.success && state.error) ? '' : 'invisible'
				}`}
			>
				{state.error ? <span className="text-red-500">{state.error}</span> : null}
			</p>
		</form>
	);
}