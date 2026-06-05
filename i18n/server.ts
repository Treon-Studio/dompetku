import type { Locale } from './index';
import { defaultLocale, isValidLocale } from './index';

export function getLocaleFromRequest(request: Request): Locale {
	const url = new URL(request.url);
	const pathname = url.pathname;

	const firstSegment = pathname.split('/')[1];
	if (firstSegment && isValidLocale(firstSegment)) {
		return firstSegment;
	}

	const cookieHeader = request.headers.get('Cookie');
	if (cookieHeader) {
		const cookies = Object.fromEntries(
			cookieHeader.split('; ').map((c) => {
				const [key, ...val] = c.split('=');
				return [key, val.join('=')];
			})
		);
		const localeFromCookie = cookies['locale'];
		if (localeFromCookie && isValidLocale(localeFromCookie)) {
			return localeFromCookie;
		}
	}

	const acceptLanguage = request.headers.get('Accept-Language');
	if (acceptLanguage) {
		const preferred = acceptLanguage.split(',')[0]?.split('-')[0]?.toLowerCase();
		if (preferred && isValidLocale(preferred)) return preferred;
	}

	return defaultLocale;
}

export async function loadTranslations(locale: Locale) {
	try {
		const translations = await import(`./locales/${locale}.json`);
		return translations.default || translations;
	} catch {
		const fallback = await import(`./locales/${defaultLocale}.json`);
		return fallback.default || fallback;
	}
}

export function createTranslator(translations: Record<string, any>) {
	return function t(key: string, params?: Record<string, string | number>): string {
		const keys = key.split('.');
		let value: any = translations;

		for (const k of keys) {
			if (value && typeof value === 'object' && k in value) {
				value = value[k];
			} else {
				return key;
			}
		}

		if (typeof value !== 'string') return key;

		if (params) {
			return Object.entries(params).reduce((str, [k, v]) => str.replace(new RegExp(`{{${k}}}`, 'g'), String(v)), value);
		}

		return value;
	};
}
