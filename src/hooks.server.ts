import { type Handle, type ServerInit } from '@sveltejs/kit';
import { sequence } from '@sveltejs/kit/hooks';
import { SvelteKitHandler } from '@zenstackhq/server/sveltekit';
import { env } from '$env/dynamic/private';
import '$lib/server/auth/oidc/config';
import { prisma } from '$lib/db/prisma';
import { getPrisma } from '$lib/server/auth/db';
import { authHandle } from '$lib/server/auth/handle';
import { getSettings } from '$lib/server/config';
import { handleRateLimits } from '$lib/server/limits/handle';
import { customAlphabet } from 'nanoid';
import { log } from '$lib/server/log';
import bcrypt from 'bcryptjs';
import { readdir } from 'fs/promises';
import { join } from 'path';
export const init: ServerInit = async () => {
	try {
		const files = await readdir(join(process.cwd(), '/src/lib/i18n/translations'));
		const settings = await getSettings();

		settings.set('AVAILABLE_LANGUAGES', files.map((t) => t.replace('.json', '')).join(','));
		await settings.updateDB();

		if (settings.get<boolean>('DB_OFFLINE')) {
			log.error('Database is Offline # DB is not connected and cannot be initialized.');
			log.info('Retry in 60s...');
			setTimeout(() => {
				init();
			}, 60000);

			return;
		}
		const admin = await prisma.user.findFirst({ where: { role: 'root' } });

		if (!admin) {
			const hash = await bcrypt.hash(process.env.ADMIN_PASSWORD || 'password', 12);
			await prisma.user.create({
				data: {
					email: process.env.ADMIN_EMAIL || 'admin@example.com',
					password: hash,
					role: 'root',
					username: process.env.ADMIN_USERNAME || 'admin',
					verified: true
				}
			});
		}
	} catch (error) {
		log.error(error);
	}
};

const apiHandle = SvelteKitHandler({
	getPrisma,
	prefix: '/api',
	zodSchemas: true
});

const themeHandle: Handle = ({ event, resolve }) => {
	const lang = event.cookies.get('language')?.toString() || 'en';
	const theme = event.cookies.get('theme')?.toString() || 'dark';

	if (theme) event.locals.theme = theme;
	if (lang) event.locals.lang = lang;

	return resolve(event, {
		transformPageChunk({ html }) {
			let _html = html.replace('%LANG%', lang)
			if(['ar'].includes(lang)) _html = _html.replace('%DIR%', 'rtl')
				else _html =_html.replace('%DIR%', 'ltr')
			if (theme && theme === 'light') {
				return _html.replace('class="dark"', 'class="light"');
			}
			if (theme && theme === 'system') {
				return _html.replace('class="dark"', 'class="system"');
			}
			return _html;
		}
	});
};

const handleErrorWithDB: Handle = async ({ event, resolve }) => {
	try {
		let ping = false;
		try {
			await prisma.$queryRaw`SELECT 1`;
		} catch (e) {
			if (env.LOG_LEVEL === 'debug') log.error(e);
			ping = true;
		}
		const settings = await getSettings();
		if (ping) settings.set('DB_OFFLINE', true);
		else {
			settings.set('DB_OFFLINE', false);
			if(process.env.LOG_LEVEL !=='debug') console.clear();
		}
	} catch (error) {
		log.error(error);
	}

	return resolve(event);
};

const transformShortcodeMiddleware: Handle = async ({ event, resolve }) => {
	const pathname = new URL(event.request.url).pathname;

	if (event.request.method !== 'POST' || pathname !== '/api/snapp/create') {
		return resolve(event);
	}

	try {
		const cloned = event.request.clone();
		const json = await cloned.json();

		if (typeof json?.data !== 'object' || !json.data.originalUrl || json.data.shortcode) {
			return resolve(event);
		}

		const data = json.data;

		if (!data.shortcode) {
			const alphabet = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
			const len = Math.max(4, Math.min(20, Number(data.shortLength) || 5));
			const gen = customAlphabet(alphabet, len);

			let candidate: string;
			let attempts = 0;
			let exists: number;
			do {
				candidate = gen();
				exists = await prisma.snapp.count({ where: { shortcode: candidate } });
				attempts++;
				if (attempts > 10) {
					return resolve(event);
				}
			} while (exists > 0);

			data.shortcode = candidate;
		}

		delete data.shortLength;

		// rebuild request with correct shape
		event.request = new Request(event.request.url, {
			method: event.request.method,
			headers: event.request.headers,
			body: JSON.stringify({ data })
		});
	} catch (err: any) {
		log.error('Error in transformShortcodeMiddleware', err);
	}

	return resolve(event);
};

export const handle = sequence(
	handleErrorWithDB,
	handleRateLimits,
	authHandle,
	transformShortcodeMiddleware,
	apiHandle,
	themeHandle
);
