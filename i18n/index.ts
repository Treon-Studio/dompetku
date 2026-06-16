export { getLocaleFromRequest } from "./server";

export const locales = ["en", "id", "bjn", "jv"] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "en";

export function isValidLocale(locale: string): locale is Locale {
	return locales.includes(locale as Locale);
}

export function getLocaleFromHeader(request: Request): Locale {
	const acceptLanguage = request.headers.get("Accept-Language");
	if (!acceptLanguage) return defaultLocale;

	const preferred = acceptLanguage.split(",")[0]?.split("-")[0]?.toLowerCase();
	if (preferred && isValidLocale(preferred)) return preferred;

	return defaultLocale;
}
