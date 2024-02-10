// src/hooks.server.js

import { SvelteKitAuth, type Session } from '@auth/sveltekit';
import CredentialsProvider from '@auth/core/providers/credentials';
import { sequence } from '@sveltejs/kit/hooks';
import { type Handle } from '@sveltejs/kit';
import { db } from '$lib/db';
import { env } from '$env/dynamic/private';
import type { JWT } from '@auth/core/jwt';
import bcrypt from 'bcrypt';

const snappHandler = (async ({ event, resolve }) => {
	const locals = event.locals;

	const session = await locals.getSession();
	let theme = event.cookies.get('snapp:theme')?.toString();
	let lang = event.cookies.get('snapp:lang')?.toString();
	if (!theme || !lang) {
		const user = session
			? await db.users.fetch(session?.user.id).then((user) => user as DBUser)
			: null;

		theme = user?.settings?.theme ?? env.DEFAULT_THEME ?? 'dark';
		lang = user?.settings?.lang ?? env.DEFAULT_LANG ?? 'en';
	}

	event.locals.theme = theme;
	event.locals.lang = lang;

	return await resolve(event, {
		transformPageChunk({ html }) {
			let newHTML = html;
			if (typeof theme === 'string' && theme === 'light')
				newHTML = newHTML.replace('dark', 'light');
			if (typeof lang === 'string' && lang !== 'en') newHTML = newHTML.replace('en', lang);
			return newHTML;
		}
	});
}) satisfies Handle;

const authHandler = SvelteKitAuth({
	providers: [
		CredentialsProvider({
			credentials: {
				username: { label: 'Username', type: 'text', placeholder: 'jsmith' },
				password: { label: 'Password', type: 'password' }
			},
			async authorize({ username, password }) {
				try {
					const user = await db.users
						.search()
						.where('username')
						.equals(username as string)
						.first();

					if (!user) throw new Error('auth:user:not:found');
					if (user && (await bcrypt.compare(password as string, user.hash as string)))
						return {
							id: user.id as string
						};
					else throw new Error('unmatching ssr login');
				} catch (error) {
					throw error;
				}
			}
		})
	],
	session: { strategy: 'jwt' },
	callbacks: {
		jwt(params) {
			const { token, user } = params;
			if (user) return { ...token, id: user.id };
			else return token;
		},
		session(params) {
			let { token, session } = params as { session: Session; token: JWT };
			if (token) session = { ...session, user: { ...session.user, id: token.id as string } };
			return session;
		}
	},
	pages: {
		signIn: '/auth/sign-in'
	},
	trustHost: true
});

async function initializeDBIndexes() {
	const {
		ENABLE_SIGNUP,
		SMTP_HOST,
		SMTP_PASSWORD,
		ENABLE_LIMITS,
		ENABLE_HOME,
		SMTP_PORT,
		SMTP_USER,
		SMTP_FROM,
		MAX_SHORT_URL,
		VIRUSTOTAL_API_KEY,
		MAX_USAGES,
		MAX_RPM,
		MAX_RPD,
		UMAMI_WEBSITE_ID,
		UMAMI_URL
	} = env;
	try {
		await db.users.createIndex();
		await db.apikeys.createIndex();
		await db.snapps.createIndex();
		await db.usages.createIndex();

		await check_and_set('settings:app:limits:enabled', ENABLE_LIMITS?.toString()?.toLowerCase());
		await check_and_set('settings:app:limits:max:urls', MAX_SHORT_URL?.toString()?.toLowerCase());
		await check_and_set('settings:app:limits:max:usages', MAX_USAGES?.toString()?.toLowerCase());
		await check_and_set('settings:app:limits:max:rpm', MAX_RPM?.toString()?.toLowerCase());
		await check_and_set('settings:app:limits:max:rpd', MAX_RPD?.toString()?.toLowerCase());
		await check_and_set('settings:app:signup:enabled', ENABLE_SIGNUP?.toString()?.toLowerCase());
		await check_and_set('settings:app:home:enabled', ENABLE_HOME?.toString()?.toLowerCase());
		await check_and_set('settings:app:smtp:host', SMTP_HOST?.toString()?.toLowerCase());
		await check_and_set('settings:app:smtp:pass', SMTP_PASSWORD?.toString()?.toLowerCase());
		await check_and_set('settings:app:smtp:port', SMTP_PORT?.toString()?.toLowerCase());
		await check_and_set('settings:app:smtp:user', SMTP_USER?.toString()?.toLowerCase());
		await check_and_set('settings:app:smtp:from', SMTP_FROM?.toString()?.toLowerCase());
		await check_and_set('settings:api:key:vt', VIRUSTOTAL_API_KEY?.toString()?.toLowerCase());
		await check_and_set(
			'settings:api:key:umami:website:id',
			UMAMI_WEBSITE_ID?.toString()?.toLowerCase()
		);
		await check_and_set('settings:api:key:umami:url', UMAMI_URL?.toString()?.toLowerCase());
	} catch (err) {
		console.log(err);
	}
}

async function check_and_set(setting: string, value: string | null) {
	const exists = await db.getSetting(setting);
	if (!exists && value) await db.setSetting(setting, value);
}

initializeDBIndexes();

export const handle = sequence(authHandler, snappHandler);
