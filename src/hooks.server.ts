import { building } from '$app/environment';
import { env } from '$env/dynamic/private';
import { lucia } from '$lib/server/auth';
import { database } from '$lib/server/db/database';
import { RPD, RPM } from '$lib/server/ratelimiter';
import { ENABLE_LIMITS, MAX_REQUESTS_PER_DAY, MAX_REQUESTS_PER_MINUTE } from '$lib/utils/constants';
import type { Handle } from '@sveltejs/kit';
import { locale } from 'svelte-i18n';

// INIT DB
const run_init_functions = async () => {
	database;

	const is_api_limited = database.settings.parse(await database.settings.get(ENABLE_LIMITS), true);
	const rpd = is_api_limited
		? parseInt((await database.settings.get(MAX_REQUESTS_PER_DAY))?.value || '0')
		: 0;
	const rpm = is_api_limited
		? parseInt((await database.settings.get(MAX_REQUESTS_PER_MINUTE))?.value || '0')
		: 0;

	if (is_api_limited) {
		RPD.configure(24 * 60 * 60 * 1000, rpd);
		RPM.configure(60 * 1000, rpm);
	}
};

if (!building) await run_init_functions();

export const handle: Handle = async ({ event, resolve }) => {
	const lang = event.cookies.get('snapp:lang')?.toString() || 'en-US';
	const theme = event.cookies.get('snapp:theme')?.toString() || env.DEFAULT_THEME || 'dark';
	if (theme) event.locals.theme = theme;

	if (lang) {
		locale.set(lang);
		event.locals.lang = lang as Language;
	}

	const sessionId = event.cookies.get(lucia.sessionCookieName);
	if (!sessionId) {
		event.locals.user = null;
		event.locals.session = null;
		return resolve(event, {
			transformPageChunk({ html }) {
				if (theme && theme !== 'dark') return html.replace('class="dark"', 'class=""');
				return html;
			}
		});
	}

	const { session, user } = await lucia.validateSession(sessionId);
	if (session && session.fresh) {
		const sessionCookie = lucia.createSessionCookie(session.id);
		event.cookies.set(sessionCookie.name, sessionCookie.value, {
			path: '.',
			...sessionCookie.attributes
		});
	}
	if (!session) {
		const sessionCookie = lucia.createBlankSessionCookie();
		event.cookies.set(sessionCookie.name, sessionCookie.value, {
			path: '.',
			...sessionCookie.attributes
		});
	}

	event.locals.user = user;
	event.locals.session = session;
	return await resolve(event, {
		transformPageChunk({ html }) {
			if (theme && theme !== 'dark') return html.replace('class="dark"', 'class=""');
			return html;
		}
	});
};
