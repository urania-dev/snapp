import { env } from '$env/dynamic/private';
import { lucia } from '$lib/server/auth.js';
import { database } from '$lib/server/db/database.js';
import { RPD, RPM } from '$lib/server/ratelimiter/index.js';
import {
	DISABLE_HOME,
	ENABLED_SIGNUP,
	ALLOW_UNSECURE_HTTP,
	ENABLE_LIMITS,
	MAX_REQUESTS_PER_DAY,
	MAX_REQUESTS_PER_MINUTE,
	MAX_SNAPPS_PER_USER,
	VIRUSTOTAL_API_KEY,
	SMTP_FROM,
	SMTP_STATUS,
	NOT_NULL,
	EQUALS_NULL,
	UMAMI_WEBSITE_ID,
	UMAMI_URL,
	ENABLED_MFA
} from '$lib/utils/constants.js';
import { join } from 'path'
import { fail, redirect } from '@sveltejs/kit';
import type { User } from 'lucia';
import { createTransport, type Transport, type TransportOptions } from 'nodemailer';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
import * as shiki from 'shiki';
import { getServerSideSettings } from '$lib/server/server-wide-settings/index.js';

export async function load({ locals: { user, session, theme }, fetch, url }) {
	if (!session || !user) redirect(302, '/auth/sign-in');
	const vtapikey = await database.settings.get(VIRUSTOTAL_API_KEY).then((res) => res?.value);

	const query = url.searchParams.get('query')?.toString();
	const limit =
		(url.searchParams.get('limit')?.toString() &&
			!isNaN(parseInt(url.searchParams.get('limit')!.toString())) &&
			parseInt(url.searchParams.get('limit')!.toString())) ||
		12;
	const offset =
		(url.searchParams.get('offset')?.toString() &&
			!isNaN(parseInt(url.searchParams.get('offset')!.toString())) &&
			parseInt(url.searchParams.get('offset')!.toString())) ||
		0;

	const is_admin = await database.users.is_admin(user.id);
	const enabled_mfa = is_admin
		? database.settings.parse(await database.settings.get(ENABLED_MFA), true)
		: false;
	const enabled_signup = is_admin
		? database.settings.parse(await database.settings.get(ENABLED_SIGNUP), true)
		: false;
	const disable_home = is_admin
		? database.settings.parse(await database.settings.get(DISABLE_HOME), true)
		: false;
	const allow_http = is_admin
		? database.settings.parse(await database.settings.get(ALLOW_UNSECURE_HTTP), true)
		: false;
	const enable_limits = is_admin
		? database.settings.parse(await database.settings.get(ENABLE_LIMITS), true)
		: false;
	const configPath = join(process.cwd(), 'smtp.config.cjs');
	let smtpConfig = require(configPath) as (_database: typeof database) => Promise<any>;
	const smtp = await smtpConfig(database)
	return {
		user,
		enabled_mfa,
		enabled_signup,
		disable_home,
		enable_limits,
		allow_http,
		vtapikey,
		is_admin,
		limit,
		query,
		offset,
		token: await database.tokens.get(user.id),
		rpd: is_admin
			? await database.settings.get(MAX_REQUESTS_PER_DAY).then((res) => parseInt(res?.value || '0'))
			: 0,
		rpm: is_admin
			? await database.settings
				.get(MAX_REQUESTS_PER_MINUTE)
				.then((res) => parseInt(res?.value || '0'))
			: 0,
		spu: is_admin
			? await database.settings.get(MAX_SNAPPS_PER_USER).then((res) => parseInt(res?.value || '0'))
			: 0,
		umami_website_id: is_admin
			? await database.settings.get(UMAMI_WEBSITE_ID).then((res) => res?.value)
			: undefined,
		umami_url: is_admin
			? await database.settings.get(UMAMI_URL).then((res) => res?.value)
			: undefined,
		smtp_host: is_admin
			? smtp?.host
			: undefined,
		smtp_port: is_admin
			? smtp?.port
			: undefined,
		smtp_user: is_admin
			? smtp?.auth.user
			: undefined,
		smtp_pass: is_admin
			? smtp?.auth.pass
			: undefined,
		smtp_from: is_admin
			? await database.settings.get(SMTP_FROM).then((res) => res?.value)
			: undefined,
		smtp_ssl: is_admin
			? smtp?.secure
			: undefined,
		blacklist_count: is_admin ? await database.watchlist.count(false) : 0,
		blacklist_count_emails: is_admin
			? await database.watchlist.count(false, NOT_NULL, NOT_NULL)
			: 0,
		blacklist_count_domains: is_admin
			? await database.watchlist.count(false, EQUALS_NULL, NOT_NULL)
			: 0,
		blacklist_count_usernames: is_admin
			? await database.watchlist.count(false, NOT_NULL, EQUALS_NULL)
			: 0,
		blacklist_emails: is_admin
			? await database.watchlist.list(
				true,
				limit,
				offset,
				query ? { startsWith: query } : NOT_NULL,
				NOT_NULL
			)
			: [],
		blacklist_domains: is_admin
			? await database.watchlist.list(
				true,
				limit,
				offset,
				EQUALS_NULL,
				query ? { startsWith: query } : NOT_NULL
			)
			: [],
		blacklist_usernames: is_admin
			? await database.watchlist.list(
				true,
				limit,
				offset,
				query ? { startsWith: query } : NOT_NULL,
				EQUALS_NULL
			)
			: [],
		whitelist_count: is_admin ? await database.watchlist.count(true) : 0,
		whitelist_count_emails: is_admin ? await database.watchlist.count(true, NOT_NULL, NOT_NULL) : 0,
		whitelist_count_domains: is_admin
			? await database.watchlist.count(true, EQUALS_NULL, NOT_NULL)
			: 0,
		whitelist_count_usernames: is_admin
			? await database.watchlist.count(true, NOT_NULL, EQUALS_NULL)
			: 0,
		whitelist_emails: is_admin
			? await database.watchlist.list(
				true,
				limit,
				offset,
				query ? { startsWith: query } : NOT_NULL,
				NOT_NULL
			)
			: [],
		whitelist_domains: is_admin
			? await database.watchlist.list(
				true,
				limit,
				offset,
				EQUALS_NULL,
				query ? { startsWith: query } : NOT_NULL
			)
			: [],
		whitelist_usernames: is_admin
			? await database.watchlist.list(
				true,
				limit,
				offset,
				query ? { startsWith: query } : NOT_NULL,
				EQUALS_NULL
			)
			: [],
		vtapistatus: is_admin ? await (await fetch('/api/utils/virus-total-protection')).json() : false,
		smtp_status: is_admin ? await (await fetch('/api/utils/smtp-server')).json() : false,
		code: await code(theme)
	};
}

export const actions = {
	signout: async (event) => {
		if (!event.locals.session) {
			return fail(401);
		}
		await lucia.invalidateSession(event.locals.session.id);
		const sessionCookie = lucia.createBlankSessionCookie();
		event.cookies.set(sessionCookie.name, sessionCookie.value, {
			path: '.',
			...sessionCookie.attributes
		});
		redirect(302, '/');
	},
	'update-field': async ({ locals: { session, user }, request, cookies }) => {
		if (!session || !user) redirect(302, '/');

		const form = await request.formData();

		const table = form.get('table')?.toString();
		const field = form.get('key')?.toString();
		const value = form.get('value')?.toString();
		if (!field || !value || typeof field !== 'string' || typeof value !== 'string')
			return fail(400, { message: 'errors.settings.invalid-field-value-touple' });
		const payload = { [field]: value };
		if (table === 'user') {
			if (
				field === 'email' &&
				(typeof value !== 'string' ||
					!/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/.test(value) ||
					!value.trim().length)
			)
				return fail(400, { message: 'errors.auth.email-invalid' });
			const [, userError] = await database.users.update(payload as Partial<User>, user.id);
			if (userError) return fail(400, { message: 'errors.auth.email-registered' });
		}

		if (table === 'settings') {
			if (field === 'language') {
				cookies.set('snapp:lang', value, { path: '/', secure: true, httpOnly: true });
				await database.settings.set(field, value, user.id);
				return { message: 'settings.saved' };
			}
			if (field === 'theme') {
				cookies.set('snapp:theme', value, { path: '/', secure: true, httpOnly: true });
				await database.settings.set(field, value, user.id);
				return { message: 'settings.saved' };
			}

			if (field.toLowerCase().startsWith('smtp')) await database.settings.delete(SMTP_STATUS);

			await database.settings.set(field, value);
			if (field === ENABLED_MFA) {
				const settings = getServerSideSettings()
				settings.set(ENABLED_MFA, value === 'true')
			}
			if (
				field === MAX_REQUESTS_PER_DAY ||
				field === MAX_REQUESTS_PER_MINUTE ||
				field === ENABLE_LIMITS
			) {
				const is_api_limited = database.settings.parse(
					await database.settings.get(ENABLE_LIMITS),
					true
				);
				const rpd = is_api_limited
					? parseInt((await database.settings.get(MAX_REQUESTS_PER_DAY))?.value || '0')
					: 0;
				const rpm = is_api_limited
					? parseInt((await database.settings.get(MAX_REQUESTS_PER_MINUTE))?.value || '0')
					: 0;

				if (is_api_limited) {
					RPD.configure(24 * 60 * 60 * 1000, rpd);
					RPM.configure(60 * 1000, rpm);

					RPD.enable();
					RPM.enable();
				} else {
					RPD.disable();
					RPM.disable();
				}
			}
		}
		return { message: 'settings.saved' };
	},
	'handle-token': async ({ locals: { session, user } }) => {
		if (!session || !user) redirect(302, '/');
		const token = await database.tokens.get(user.id);
		if (!token) await database.tokens.create(user.id);
		else await database.tokens.delete(user.id);
	},
	whitelist: async ({ locals: { user, session }, request }) => {
		if (!session || !user) redirect(302, '/');

		const form = await request.formData();
		const username = form.get('username')?.toString();
		const domain = form.get('domain')?.toString();
		if (!username && !domain) return fail(400);
		await database.watchlist.set(domain, username, true);
	},
	blacklist: async ({ locals: { user, session }, request }) => {
		if (!session || !user) redirect(302, '/');

		const form = await request.formData();
		const username = form.get('username')?.toString();
		const domain = form.get('domain')?.toString();

		await database.watchlist.set(domain, username, false);
	},
	'remove-from-list': async ({ locals: { user, session }, request }) => {
		if (!session || !user) redirect(302, '/');

		const form = await request.formData();
		const id = form.get('id')?.toString();
		if (!id) return fail(400);
		await database.watchlist.delete(id);
	},
	'reset-mfa': async ({ cookies, locals: { user, session } }) => {
		if (!session || !user) redirect(302, '/');

		await database.users.update_two_factor_secret(user.id, session.id, true)
		await lucia.invalidateSession(session.id)
		const _session = await lucia.createSession(user.id, { two_factor_verified: false })
		const sessionCookie = lucia.createSessionCookie(_session.id);
		cookies.set(sessionCookie.name, sessionCookie.value, {
			path: '.',
			...sessionCookie.attributes
		});

	},
	'reset-password': async ({ locals: { session, user }, url, request }) => {
		if (!session || !user) redirect(302, '/');

		try {
			const configPath = join(process.cwd(), 'smtp.config.cjs');
			let smtpConfig = require(configPath) as (_database: typeof database) => Promise<TransportOptions>;
			const smtp = await smtpConfig(database)

			const from = await database.settings.get(SMTP_FROM).then((res) => res?.value);
			const transporter = createTransport<Transport>({ ...smtp } as TransportOptions);

			const html = String((await import('$lib/emails/reset_password.html?raw')).default);

			const APPNAME = env.APPNAME || 'Snapp.li';
			const ORIGIN_URL = env.ORIGIN;
			const LOGO_URL = url.origin + '/logo.svg';
			const NAME = user.username;
			const TOKEN = await database.users.reset_token(user.id);
			const URL = url.origin + '/auth/recover-password?token=' + TOKEN;

			const flag = await transporter.sendMail({
				from: APPNAME + ' <' + from + '>',
				to: user.email,
				subject: 'Snapp: Password Recovery',
				html: html
					.replaceAll('{APP_NAME}', APPNAME)
					.replaceAll('{ORIGIN_URL}', ORIGIN_URL)
					.replaceAll('{LOGO_URL}', LOGO_URL)
					.replaceAll('{NAME}', NAME)
					.replaceAll('{URL}', URL)
			});

			return { message: 'users.auth.post-email-message' };
		} catch (error) {
			console.log(error);
			return { sent: false };
		}
	}
};

const code = async (theme: string) =>
	await shiki.codeToHtml(
		`const request = await fetch(\`api/\${endpoint}\`, {
    "headers": {
        "Authorization": \`Bearer \${token}\`
    \}
})`,
		{
			lang: 'typescript',
			theme: 'github-dark'
		}
	);
