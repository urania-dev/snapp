import { locale, waitLocale } from 'svelte-i18n';
import '$lib/i18n';

export async function load({ data, fetch }) {
	if (data.lang) locale.set(data.lang);
	await waitLocale();

	return { ...data, fetch };
}
