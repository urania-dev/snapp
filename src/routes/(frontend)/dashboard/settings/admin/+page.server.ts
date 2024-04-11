import {
	db,
	domainZList,
	emailZList,
	providerZList,
	usernameZList,
	whiteEmailZList,
	whiteProviderZList
} from '$lib/db/index.js';
import { fail, redirect } from '@sveltejs/kit';
import { error } from 'console';
import { createTransport, type TransportOptions } from 'nodemailer';
import { dev } from '$app/environment';

export async function load({ locals, depends, fetch }) {
	depends('snapp:admin:settings');
	const session = await locals.getSession();
	if (!session) throw redirect(302, '/auth/sign-in');

	const id = session.user.id;
	const user = (await db.users.search().where('id').equal(id).first()) as DBUser;
	if (!user) throw error(404, { message: 'auth:user:not:found' });

	if (!user.roles.includes('admin') || !user.roles.includes('superadmin'))
		throw error(401, { message: 'auth:not:authorized' });

	const { active_smtp } = await (await fetch('/api/smtp/test')).json();

	const vtapikey = await db.getSetting('settings:api:key:vt');
	return {
		app_settings: {
			smtp: {
				host: await db.getSetting('settings:app:smtp:host'),
				from: await db.getSetting('settings:app:smtp:from'),
				pass: await db.getSetting('settings:app:smtp:pass'),
				port: await db.getSetting('settings:app:smtp:port'),
				user: await db.getSetting('settings:app:smtp:user')
			},
			signup: {
				enabled: (await db.getSetting('settings:app:signup:enabled')) === 'true'
			},
			home: {
				enabled: (await db.getSetting('settings:app:home:enabled')) === 'true'
			},
			limits: {
				enabled: (await db.getSetting('settings:app:limits:enabled')) === 'true',
				max: {
					urls: await db.getSetting('settings:app:limits:max:urls').then((res) => {
						if (Number(res) === 0) return undefined;
						else return Number(res);
					}),
					rpd: await db.getSetting('settings:app:limits:max:rpd').then((res) => {
						if (Number(res) === 0) return undefined;
						else return Number(res);
					}),
					rpm: await db.getSetting('settings:app:limits:max:rpm').then((res) => {
						if (Number(res) === 0) return undefined;
						else return Number(res);
					})
				}
			},
			banlists: {
				websites: await db.redis.zCard(domainZList),
				usernames: await db.redis.zCard(usernameZList),
				emails: (await db.redis.zCard(emailZList)) + (await db.redis.zCard(providerZList))
			},
			whitelists: {
				emails: (await db.redis.zCard(whiteEmailZList)) + (await db.redis.zCard(whiteProviderZList))
			},
			allow_unsecure_http: await db
				.getSetting('settings:app:allow:unsecure:http')
				.then((res) => res?.toString().toLowerCase() === 'true')
		},
		active_smtp,
		vtapikey: vtapikey !== undefined && vtapikey !== null
	};
}

export const actions = {
	async handleLimits({ request, locals }) {
		const session = await locals.getSession();
		if (!session) throw redirect(302, '/auth/sign-in');
		const isAdmin = db.admin(session.user.id);
		if (!isAdmin) throw error(401, { message: 'auth:not:authorized' });

		const form = await request.formData();

		let max_urls: number | string | undefined = form.get('max_urls')?.toString()?.trim();
		let max_rpd: number | string | undefined = form.get('max_rpd')?.toString()?.trim();
		let max_rpm: number | string | undefined = form.get('max_rpm')?.toString()?.trim();

		if (!max_urls || max_urls === '' || isNaN(Number(max_urls))) max_urls = 0;
		else max_urls = Number(max_urls);

		if (!max_rpd || max_rpd === '' || isNaN(Number(max_rpd))) max_rpd = 0;
		else max_rpd = Number(max_rpd);

		if (!max_rpm || max_rpm === '' || isNaN(Number(max_rpm))) max_rpm = 0;
		else max_rpm = Number(max_rpm);

		if (max_urls !== 0) {
			await db.setSetting('settings:app:limits:max:urls', `${max_urls}`);
		} else if (max_urls === 0) await db.redis.del('settings:app:limits:max:urls');
		if (max_rpd !== 0) {
			await db.setSetting('settings:app:limits:max:rpd', `${max_rpd}`);
		} else if (max_rpd === 0) await db.redis.del('settings:app:limits:max:rpd');
		if (max_rpm !== 0) {
			await db.setSetting('settings:app:limits:max:rpm', `${max_rpm}`);
		} else if (max_rpm === 0) await db.redis.del('settings:app:limits:max:rpm');

		return { success: true, status: 200, message: 'settings:app:wise:saved' };
	},
	async handleSettings({ request, locals }) {
		const session = await locals.getSession();
		if (!session) throw redirect(302, '/auth/sign-in');
		const isAdmin = db.admin(session.user.id);
		if (!isAdmin) throw error(401, { message: 'auth:not:authorized' });

		const form = await request.formData();

		const signup = form.get('signup')?.toString();
		const home = form.get('home')?.toString();
		const limits = form.get('limits')?.toString();
		const allow_unsecure_http = form.get('allowUnsecureHttp')?.toString();

		if (!home || (home !== 'enabled' && home !== 'disabled'))
			throw error(404, { message: 'settings:not:found' });
		if (!signup || (signup !== 'enabled' && signup !== 'disabled'))
			throw error(404, { message: 'settings:not:found' });
		if (!limits || (limits !== 'enabled' && limits !== 'disabled'))
			throw error(404, { message: 'settings:not:found' });
		if (
			!allow_unsecure_http ||
			(allow_unsecure_http !== 'enabled' && allow_unsecure_http !== 'disabled')
		)
			throw error(404, { message: 'settings:not:found' });

		switch (signup) {
			case 'enabled':
				await db.setSetting('settings:app:signup:enabled', 'true');
				break;
			case 'disabled':
				await db.setSetting('settings:app:signup:enabled', 'false');
				break;
		}
		switch (limits) {
			case 'enabled':
				await db.setSetting('settings:app:limits:enabled', 'true');
				break;
			case 'disabled':
				await db.setSetting('settings:app:limits:enabled', 'false');
				break;
		}

		switch (home) {
			case 'enabled':
				await db.setSetting('settings:app:home:enabled', 'true');
				break;
			case 'disabled':
				await db.setSetting('settings:app:home:enabled', 'false');
				break;
		}
		switch (allow_unsecure_http) {
			case 'enabled':
				await db.setSetting('settings:app:allow:unsecure:http', 'true');
				break;
			case 'disabled':
				await db.setSetting('settings:app:allow:unsecure:http', 'false');
				break;
		}

		return { status: 200, success: true, message: 'settings:app:wise:saved' };
	},
	async handleSMTP({ request, locals }) {
		const session = await locals.getSession();
		if (!session) throw redirect(302, '/auth/sign-in');
		const isAdmin = db.admin(session.user.id);
		if (!isAdmin) throw error(401, { message: 'auth:not:authorized' });

		const form = await request.formData();

		const host = form.get('host')?.toString()?.trim();
		const pass = form.get('pass')?.toString()?.trim();
		const from = form.get('from')?.toString()?.trim();
		const user = form.get('user')?.toString()?.trim();
		const port = form.get('port')?.toString()?.trim();

		if (typeof host !== 'string' || host === '')
			return fail(400, { host: true, message: 'settings:app:smtp:host:unset' });
		if (typeof pass !== 'string' || pass === '')
			return fail(400, { pass: true, message: 'settings:app:smtp:pass:unset' });
		if (typeof from !== 'string' || from === '')
			return fail(400, { from: true, message: 'settings:app:smtp:from:unset' });
		if (typeof user !== 'string' || user === '')
			return fail(400, { user: true, message: 'settings:app:smtp:user:unset' });
		if (typeof port !== 'string' || port === '')
			return fail(400, { port: true, message: 'settings:app:smtp:port:unset' });

		await db.setSetting('settings:app:smtp:host', host);
		await db.setSetting('settings:app:smtp:from', from);
		await db.setSetting('settings:app:smtp:pass', pass);
		await db.setSetting('settings:app:smtp:port', port);
		await db.setSetting('settings:app:smtp:user', user);

		const smtp = {
			host,
			port,
			secure: true,
			auth: {
				pass,
				user
			}
		};

		const transporter = createTransport({ ...smtp } as TransportOptions);

		try {
			const response = await transporter.verify();
			await db.redis.set('cache:smtp:check', `${response}`);
			await db.redis.expire('cache:smtp:check', 60 * 60 * 24);
			return {
				message: 'settings:app:smtp:working',
				host: false,
				port: false,
				pass: false,
				user: false,
				from: false
			};
		} catch (error) {
			return fail(500, {
				message: 'settings:app:smtp:not:working',
				host: true,
				port: true,
				pass: true,
				user: true,
				from: true
			});
		}
	}
};
