import { Link } from '@remix-run/react';
import { useEffect, useRef, useState } from 'react';

import CircleLoader from '~/components/loader/circle';
import { Button } from '~/components/ui/button';

import { apiUrls } from '~/lib/apiUrls';

import url from '~/constants/url';
import { isEmail, isPhone } from '~/constants/validation';
import { useTranslation } from '@i18n/client';

const initialState = { loading: false, identity: '', password: '', success: false, error: '' };

export default function Form() {
  const { t } = useTranslation();
  const [state, setState] = useState(initialState);
  const inputElement = useRef<HTMLInputElement>(null);


	useEffect(() => {
		inputElement.current?.focus();
	}, []);

	const handleSignIn = async () => {
		const identity = state.identity.trim();
		if (!isEmail(identity) && !isPhone(identity)) {
			setState((prev) => ({ ...prev, error: 'Please enter a valid email or phone number', loading: false }));
			return;
		}

		setState((prev) => ({ ...prev, loading: true, error: '', success: false }));

		try {
			const res = await fetch(apiUrls.auth.signin, {
				method: 'POST',
				body: JSON.stringify({ identity: identity, password: state.password }),
				headers: { 'Content-Type': 'application/json' },
				redirect: 'manual',
			});

			if (res.type === 'opaqueredirect' || res.ok) {
				window.location.href = '/dashboard';
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
				<span className="mb-2 block text-sm font-semibold leading-6">{t('auth.identity')}</span>
				<input
					className="mt-2 block h-10 w-full appearance-none rounded-md bg-white px-3 text-sm text-black shadow-xs ring-1 ring-gray-300 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-gray-900"
					autoFocus
					type="text"
					inputMode="text"
					autoComplete="username"
					placeholder="tim@apple.com / +62812345678"
					required
					value={state.identity}
					onChange={(event) => {
						setState({ ...state, identity: event.target.value });
					}}
					ref={inputElement}
				/>
			</label>
			<label className="mb-1 block">
				<span className="mb-2 block text-sm font-semibold leading-6">{t('auth.password')}</span>
				<input
					className="mt-2 block h-10 w-full appearance-none rounded-md bg-white px-3 text-sm text-black shadow-xs ring-1 ring-gray-300 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-gray-900"
					type="password"
					autoComplete="current-password"
					placeholder="********"
					required
					maxLength={128}
					value={state.password}
					onChange={(event) => {
						setState({ ...state, password: event.target.value });
					}}
				/>
			</label>
			<div className="flex items-center justify-end">
				<Link
					to={url.app.forgotPassword}
					className="text-sm font-medium text-gray-600 hover:text-gray-900"
				>
					{t('auth.forgotPassword')}
				</Link>
			</div>
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
