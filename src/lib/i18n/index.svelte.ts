import { getContext, setContext } from "svelte";
// Type for the translations object
export interface Translations {
	[key: string]: string | Translations;
}

class TranslationsStore {
	locale: string = $state("en");
	translations = $state<Translations>({});
	constructor(translations: Translations, locale?: string) {
		this.translations = translations;
		if (locale) this.locale = locale;
	}
	set(translations: Translations) {
		this.translations = translations;
	}

	t = (key: string, params: Record<string, number | string> = {}) => {
		const keys = key.split(".");
		let value: string | Translations = this.translations;

		// Traverse the nested object to get the translation
		for (const k of keys) {
			if (typeof value === "object" && value !== null && k in value) {
				value = value[k] as string | Translations;
			} else {
				return key; // Fallback to the key if not found
			}
		}

		// Check if the final value is a string
		if (typeof value === "string") {
			// Perform interpolation if necessary
			return value?.replace(/\{(\w+)\}/g, (_, match) => {
				return params[match] !== undefined ? String(params[match]) : `{{${match}}}`;
			});
		}

		return key; // Fallback to the key if the value isn't a string
	};
}

export const setTranslations = (t: Translations, locale?: string) => {
	return setContext("TRANSLATIONS", new TranslationsStore(t, locale));
};

export const getTranslations = () => {
	return getContext<TranslationsStore>("TRANSLATIONS");
};

export type TranslationsStoreType = TranslationsStore;
