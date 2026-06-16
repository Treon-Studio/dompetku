export const PASSWORD_MIN_LENGTH = 6;
export const PASSWORD_MAX_LENGTH = 128;
export const INPUT_MAX_LENGTH = 60;
export const NOTES_MAX_LENGTH = 60;
export const URL_MAX_LENGTH = 2000;
export const FEEDBACK_MAX_LENGTH = 500;
export const PRICE_MAX_VALUE = 1000000000000;
export const AUTOCOMPLETE_DEBOUNCE_MS = 500;
export const AUTOCOMPLETE_MIN_LENGTH = 2;
export const TOAST_VISIBLE_COUNT = 3;

export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const PHONE_REGEX = /^\+?[1-9]\d{6,14}$/;
export const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

export function isEmail(value: string): boolean {
	return EMAIL_REGEX.test(value);
}

export function isPhone(value: string): boolean {
	return PHONE_REGEX.test(value);
}

export function isValidDate(value: string): boolean {
	if (!DATE_REGEX.test(value)) return false;
	const date = new Date(value);
	return !Number.isNaN(date.getTime()) && value === date.toISOString().substring(0, 10);
}

export function isValidUrl(value: string): boolean {
	try {
		const u = new URL(value);
		return u.protocol === "http:" || u.protocol === "https:";
	} catch {
		return false;
	}
}

export function isValidPrice(value: string): boolean {
	const num = parseFloat(value);
	return !Number.isNaN(num) && Number.isFinite(num) && num >= 0 && num <= PRICE_MAX_VALUE;
}

export function isRequired(value: unknown): value is string {
	return typeof value === "string" && value.trim().length > 0;
}
