import { error } from '@sveltejs/kit';
import { readFile } from 'fs/promises';
import path from 'path';

import type { Translations } from './index.svelte';

/**
 * Load translations for a specific locale from JSON files.
 * @param locale - The locale to load (e.g., "en", "fr").
 * @returns A translations object for the specified locale.
 */
export async function loadTranslations(locale: string): Promise<Translations> {
	const filePath = path.resolve(`src/lib/i18n/translations/${locale}.json`);
	try {
		const fileContent = await readFile(filePath, 'utf-8');
		return JSON.parse(fileContent);
	} catch (e) {
		error(500, {
			...(e as Error),
			message: `Failed to load translations for locale: ${locale}`
		});
	}
}
