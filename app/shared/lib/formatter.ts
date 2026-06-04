import { dateFormat } from '~/shared/constants/date';

const defaultCurrency = 'INR';
const defaultLocale = 'en-IN';
const defaultDateStyle = { day: '2-digit', month: 'short', year: 'numeric' };
const timeStyle = { hour: 'numeric', minute: 'numeric' };
const currencyStyle = { style: 'currency' as const, currency: '', minimumFractionDigits: 0, maximumFractionDigits: 2 };

type Currency = {
	value: number | bigint;
	currency?: string;
	locale?: any;
};

type Date = {
	date: string;
	locale?: string;
	dateStyle?: any;
};

export const formatCurrency = ({ value, currency = defaultCurrency, locale = defaultLocale }: Currency): any => {
	try {
		return new Intl.NumberFormat(locale, { ...currencyStyle, currency }).format(value).replace(/^(\D+)/, '$1 ').replace(/\s+/g, ' ').replace(/\u00A0/g, ' ');
	} catch {
		return value;
	}
};

export const formatDate = ({ date, locale = defaultLocale, dateStyle = defaultDateStyle }: Date): any => {
	try {
		return new Intl.DateTimeFormat(locale, dateStyle).format(new Date(date));
	} catch {
		return date;
	}
};

export const getCurrencySymbol = (
	currency: string = defaultCurrency,
	locale: string = defaultLocale
): String | undefined => {
	try {
		return new Intl.NumberFormat(locale, { ...currencyStyle, currency })
			?.formatToParts(1)
			?.find((x) => x.type === 'currency')?.value;
	} catch {
		return '';
	}
};

export const formatInputPrice = (value: string | number) => {
	if (value === null || value === undefined || value === '') return '';
	const str = value.toString();
	const parts = str.split('.');
	parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
	return parts.join('.');
};

export const parseInputPrice = (value: string) => {
	// Remove all characters except digits and dots
	let raw = value.replace(/[^\d.]/g, '');
	// Ensure only one dot is kept
	const parts = raw.split('.');
	if (parts.length > 2) {
		raw = parts[0] + '.' + parts.slice(1).join('');
	}
	return raw;
};
