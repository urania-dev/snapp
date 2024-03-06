import { derived, writable, type Readable, type Writable } from 'svelte/store';
import { setContext, getContext } from 'svelte';

const LNG_CTX = 'LNG_CTX' as const;

type Translation = Record<string, string>;

export function setLocale(localization: Translation) {
	const locale = writable(localization);

	const t = derived(
		locale,
		($locale) =>
			(translationKey: string, vars = {}) =>
				translate(translationKey, vars, $locale)
	);

	setContext(LNG_CTX, { locale, t });

	return { locale, t };
}

export function getLocale() {
	return getContext<{
		locale: Writable<Translation>;
		t: Readable<(key: string, vars?: {}) => string>;
	}>(LNG_CTX);
}

function translate(
	translationKey: string,
	vars: { [key: string]: string },
	localization: Translation
) {
	if (!translationKey) throw new Error('no key provided to $t()');

	if (!localization || !Array.from(Object.entries(localization)).length) return translationKey;
	let text = localization[translationKey];

	if (!text) return translationKey;

	if (vars !== undefined) {
		Object.keys(vars).map((k) => {
			const regex = new RegExp(`{{${k}}}`, 'g');
			text = text.replace(regex, vars[k]);
		});
	}

	return text;
}
