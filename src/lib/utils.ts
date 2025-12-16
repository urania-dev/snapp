import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
export type WithElementRef<T, U extends HTMLElement = HTMLElement> = { ref?: null | U } & T;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type WithoutChild<T> = T extends { child?: any } ? Omit<T, 'child'> : T;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type WithoutChildren<T> = T extends { children?: any } ? Omit<T, 'children'> : T;
export type WithoutChildrenOrChild<T> = WithoutChildren<WithoutChild<T>>;
export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}
export const displaySize = (bytes: number): string => {
	if (bytes < KILOBYTE) return `${bytes.toFixed(0)} B`;
	if (bytes < MEGABYTE) return `${(bytes / KILOBYTE).toFixed(0)} KB`;
	if (bytes < GIGABYTE) return `${(bytes / MEGABYTE).toFixed(0)} MB`;
	return `${(bytes / GIGABYTE).toFixed(0)} GB`;
};
export const timeDiff = (from: Date, to = new Date()) => {
	const diff = Math.abs(to.getTime() - from.getTime());
	const sec = Math.floor(diff / 1000);
	const min = Math.floor(sec / 60);
	const hrs = Math.floor(min / 60);
	return {
		hours: hrs,
		minutes: min % 60,
		seconds: sec % 60
	};
};
export const BYTE = 1;
export const KILOBYTE = 1024;
export const MEGABYTE = 1024 * KILOBYTE;
export const GIGABYTE = 1024 * MEGABYTE;
export const generateRandomString = (length = 12) => {
	const upper = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
	const lower = 'abcdefghijklmnopqrstuvwxyz';
	const digits = '0123456789';
	const special = '!@#$%^&*()_+[]{}|;:,.<>?';
	const required = [
		upper[Math.floor(Math.random() * upper.length)],
		lower[Math.floor(Math.random() * lower.length)],
		digits[Math.floor(Math.random() * digits.length)],
		special[Math.floor(Math.random() * special.length)]
	];
	const all = upper + lower + digits + special;
	while (required.length < length) {
		required.push(all[Math.floor(Math.random() * all.length)]);
	}
	for (let i = required.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[required[i], required[j]] = [required[j], required[i]];
	}
	return required.join('');
};

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

export const slugify = (text: string = '') => {
	return text
		.normalize('NFKD')
		.replace(/[\u0300-\u036f]/g, '')
		.replace(' ', '-')
		.toLowerCase()
        .trim()
        .replace(/[^a-z0-9 -]/g, '')
        .replace(/\s+/g, '-') 
}
export const underscore = (text: string = '') => {
	return text
		.normalize('NFKD')
		.replace(/[\u0300-\u036f]/g, '')
		.replace(' ', "_")
		.toLowerCase()
        .trim()
        .replace(/[^a-z0-9 _]/g, '')
        .replace(/\s+/g, "_") 
}

export const domainFromUrl = (url: string) => {
	let result: string = '';
	let match: null | RegExpMatchArray = url.match(
		/^(?:https?:\/\/)?(?:[^@\n]+@)?(?:www\.)?([^:/\n?=]+)/im
	);
	if (match) {
		result = match[0];
		match = result.match(/^[^.]+\.(.+\..+)$/);
		if (match) {
			result = match[0];
		}
	}
	return result;
};

export const fillMissingDays = (from: Date, to: Date, stats: { day: Date; visits: number }[]) => {
	const map = new Map(stats.map((s) => [s.day.toDateString(), s.visits]));

	const out: { day: Date; visits: number }[] = [];

	const cur = new Date(from);
	const end = new Date(to);

	while (cur <= end) {
		const key = cur.toDateString();
		out.push({
			day: new Date(cur),
			visits: map.get(key) ?? 0
		});

		cur.setDate(cur.getDate() + 1);
	}

	return out;
};
import type { AnyVisit } from './server/metrics/helpers';
export const fillMissingDaysDivided = <T>(from: Date, to: Date, stats: T[]) => {
	console.log({stats})
	const map = new Map((stats as AnyVisit[]).map((s:AnyVisit) => [s.day.toDateString(), {...s, external:s.external, internal:s.internal}]));

	const out: AnyVisit[] = [];

	const cur = new Date(from);
	const end = new Date(to);

	while (cur <= end) {
		const key = cur.toDateString();
		const item = map.get(key) || {}
		out.push({
			...item,
			day: new Date(cur),
			external: map.get(key)?.external ?? 0,
			internal: map.get(key)?.internal ?? 0,
		});

		cur.setDate(cur.getDate() + 1);
	}

	return out as T[];
};

export const translateLanguage= (locale: string, languageCode: string) =>{
		const displayNames = new Intl.DisplayNames(locale, { type: 'language' });
		return displayNames.of(languageCode) || '';
	}