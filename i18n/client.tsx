import { createContext, useContext } from 'react';

export type Translator = (key: string, params?: Record<string, string | number>) => string;

export interface I18nContextValue {
	locale: string;
	t: Translator;
}

export const I18nContext = createContext<I18nContextValue | null>(null);

export function useI18n() {
	const context = useContext(I18nContext);
	if (!context) {
		throw new Error('useI18n must be used within an I18nProvider');
	}
	return context;
}

export function useTranslation() {
	const { t } = useI18n();
	return { t };
}
