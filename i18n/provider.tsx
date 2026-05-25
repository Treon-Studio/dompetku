import { I18nContext } from './client';
import type { Translator } from './client';
import { createTranslator } from './server';

export interface I18nProviderProps {
	locale: string;
	translations: Record<string, any>;
	children: React.ReactNode;
}

export function I18nProvider({ locale, translations, children }: I18nProviderProps) {
	const t: Translator = createTranslator(translations);

	return (
		<I18nContext.Provider value={{ locale, t }}>
			{children}
		</I18nContext.Provider>
	);
}