import { readdirSync, readFileSync } from 'fs';
import { resolve } from 'path';
import { env } from '$env/dynamic/private';
import { json } from '@sveltejs/kit';

export async function GET({ url: { searchParams } }) {
	// Specify the directory where your JSON files are located
	const translationsDirectory = env.LOCALIZATION_FOLDER;
	const LANG = searchParams.get('lang')?.toString()?.trim()?.toLowerCase() ?? 'en';
	// Type for translations
	type Translations = Record<string, Record<string, string>>;

	// Function to load translations from JSON files

	const translations: Translations = {};

	const files = readdirSync(translationsDirectory);

	files.forEach((file) => {
		const filePath = resolve(translationsDirectory, file);
		const locale = file.replace('.json', '');

		try {
			const jsonContent = JSON.parse(readFileSync(filePath, 'utf8'));
			translations[locale] = jsonContent;
		} catch (error: any) {
			console.error(`Error loading translation file ${filePath}: ${error.message}`);
		}
	});

	const locales = Object.keys(translations);

	const languages = Object.keys(translations).map((lang, idx) => {
		return {
			label: translations[lang]['global:misc:lang'],
			code: locales[idx]
		};
	});

	return json({ localization: translations[LANG], locales, languages });
}
