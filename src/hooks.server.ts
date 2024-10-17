import { building } from '$app/environment';
import { env } from '$env/dynamic/private';
import { lucia } from '$lib/server/auth';
import { database } from '$lib/server/db/database';
import { RPD, RPM } from '$lib/server/ratelimiter';
import { getServerSideSettings } from '$lib/server/server-wide-settings';
import { ENABLE_LIMITS, ENABLED_MFA, TAGS_AS_PREFIX, MAX_REQUESTS_PER_DAY, MAX_REQUESTS_PER_MINUTE } from '$lib/utils/constants';
import { redirect, type Handle } from '@sveltejs/kit';
import { locale } from 'svelte-i18n';

// INIT DB
const run_init_functions = async () => {
	database;
	const settings = getServerSideSettings()
	const savedInDbMFA = await database.settings.get(ENABLED_MFA)
	const savedInDbTagsAsPrefix = await database.settings.get(TAGS_AS_PREFIX)
	settings.set(ENABLED_MFA, savedInDbMFA !== null ? database.settings.parse(savedInDbMFA, true) : env.ENABLED_MFA?.toString() === "true")
	settings.set(TAGS_AS_PREFIX, savedInDbTagsAsPrefix !== null ? database.settings.parse(savedInDbTagsAsPrefix, true) : env.TAGS_AS_PREFIX?.toString() === "true")
	const is_api_limited = database.settings.parse(await database.settings.get(ENABLE_LIMITS), true);
	const rpd = is_api_limited
		? parseInt((await database.settings.get(MAX_REQUESTS_PER_DAY))?.value || '0')
		: 0;
	const rpm = is_api_limited
		? parseInt((await database.settings.get(MAX_REQUESTS_PER_MINUTE))?.value || '5')
		: 0;

	if (is_api_limited) {
		RPD.configure(24 * 60 * 60 * 1000, rpd);
		RPM.configure(60 * 1000, rpm);
	}

};

if (!building) await run_init_functions();

export const handle: Handle = async ({ event, resolve }) => {
	const settings = getServerSideSettings()
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

	if (settings.get<boolean>(ENABLED_MFA) && user && user.setupTwoFactor === false && event.url.pathname !== '/auth/mfa/setup') {
		redirect(302, '/auth/mfa/setup')
	}

	if (settings.get<boolean>(ENABLED_MFA) && user && user.setupTwoFactor === true && session && session.twoFactorVerified !== true && event.url.pathname !== '/auth/mfa')
		redirect(302, '/auth/mfa')

	event.locals.user = user;
	event.locals.session = session;

	return await resolve(event, {
		transformPageChunk({ html }) {
			if (theme && theme !== 'dark') return html.replace('class="dark"', 'class=""');
			return html;
		}
	});
};
