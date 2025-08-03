import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

const DIVISIONS = [
	{ amount: 60, name: 'seconds' },
	{ amount: 60, name: 'minutes' },
	{ amount: 24, name: 'hours' },
	{ amount: 7, name: 'days' },
	{ amount: 4.34524, name: 'weeks' },
	{ amount: 12, name: 'months' },
	{ amount: Number.POSITIVE_INFINITY, name: 'years' }
];

export function formatTimeAgo(date: Date, lang = 'en') {
	const formatter = new Intl.RelativeTimeFormat(lang, {
		numeric: 'auto',
		style: 'narrow'
	});
	let duration = (new Date(date).getTime() - new Date().getTime()) / 1000;

	for (let i = 0; i < DIVISIONS.length; i++) {
		const division = DIVISIONS[i];
		if (Math.abs(duration) < division.amount) {
			return formatter.format(Math.round(duration), division.name as Intl.RelativeTimeFormatUnit);
		}
		duration /= division.amount;
	}
}
export function sleep(ms: number) {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

export function slugify(text: string = '') {
	return text
		.normalize('NFKD') // split accented characters into their base characters and diacritical marks
		.replace(/[\u0300-\u036f]/g, '') // remove all the accents, which happen to be all in the \u03xx UNICODE block.
		.replace(' ', '-') // trim leading or trailing whitespace
		.toLowerCase() // convert to lowercase
		.replace(/[^a-z0-9 -]/g, '') // remove non-alphanumeric characters
		.replace(/\s+/g, '-') // replace spaces with hyphens
		.replace(/-+/g, '-'); // remove consecutive hyphens
}

export const convertTtlToString = (value: unknown, unit: unknown): string => {
	const v = Number(value);
	const u = String(unit).toLowerCase();

	if (!Number.isFinite(v) || v <= 0) return '7d'; // fallback

	switch (u) {
		case 'minutes':
		case 'hours':
		case 'days':
			return `${v}${u[0]}`;
		case 'months':
			return `${v * 30}d`;
		default:
			return `${v}d`;
	}
};

export function translateCountry(locale: string, languageCode: string) {
	const displayNames = new Intl.DisplayNames(locale, { type: 'region' });
	return displayNames.of(languageCode) || '';
}

export function translateLanguage(locale: string, languageCode: string) {
	const displayNames = new Intl.DisplayNames(locale, { type: 'language' });
	return displayNames.of(languageCode) || '';
}
