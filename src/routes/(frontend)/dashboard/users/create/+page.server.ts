import { db } from '$lib/db/index.js';
import type SnappError from '$lib/db/utils/snappError.js';
import { error, fail, redirect, type NumericRange } from '@sveltejs/kit';
import { randomUUID } from 'crypto';
import type { Actions } from './$types';
import { env } from '$env/dynamic/public';
import getLanguage from '$lib/api/utils/getLanguage';

export async function load({ locals, parent }) {
	const session = await locals.getSession();
	if (!session) throw redirect(302, '/auth/sign-in');
	const is_admin = await db.admin(session.user.id);
	if (!is_admin) throw error(401, { message: 'auth:not:authorized' });

	return {
		app_settings: {
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
			}
		}
	};
}
const generatePassword = (): string => {
	const randomChar = (charSet: string, length: number): string =>
		[...Array(length)].map(() => charSet[Math.floor(Math.random() * charSet.length)]).join('');
	const uppercase = randomChar.bind(null, 'ABCDEFGHIJKLMNOPQRSTUVWXYZ');
	const lowercase = randomChar.bind(null, 'abcdefghijklmnopqrstuvwxyz');
	const digit = randomChar.bind(null, '0123456789');
	const specialChar = randomChar.bind(null, '#?!@$%^&_,*-');
	const allChars = randomChar.bind(
		null,
		'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789#?!@$%^&_,*-'
	);
	const shuffle = (arr: string[]): string => arr.sort(() => Math.random() - 0.5).join('');

	return shuffle([uppercase(1), lowercase(1), digit(1), specialChar(1), allChars(8 - 4)]);
};

export const actions: Actions = {
	async create({ request, locals, fetch, url }) {
		const session = await locals.getSession();
		if (!session) throw redirect(302, '/auth/sign-in');

		const form = await request.formData();

		const username = form.get('username')?.toString()?.trim();
		const email = form.get('email')?.toString()?.trim();
		const is_admin = form.get('is_admin')?.toString()?.trim();
		let _max_urls = form.get('max_urls')?.toString()?.trim();
		let max_urls: number;

		const global_max_urls = await db.getSetting('settings:app:limits:max:urls');
		const limits_enabled = await db.getSetting('settings:app:limits:enabled');

		if (typeof _max_urls === 'string' && isNaN(Number(_max_urls)) === false)
			max_urls = Number(_max_urls);
		else max_urls = limits_enabled ? Number(global_max_urls) : 0;

		if (!username) return fail(400, { message: 'auth:username:unset' });
		if (!email) return fail(400, { message: 'auth:email:unset' });

		const password = generatePassword();
		const result = await db.signupUser({ username, email, password, confirmPassword: password });

		if (result.status !== 200) {
			const {
				status,
				data: { message }
			} = result as SnappError;

			return fail(status as NumericRange<400, 599>, { message });
		}

		const { user } = result as { user: DBUser };
		const roles = is_admin === 'true' ? ['user', 'admin'] : user.roles;

		const setting_roles = await db.updateUser({
			...user,
			roles,
			settings: { ...user.settings, max: { ...user.settings?.max, urls: Number(max_urls) } }
		});
		const notes = form.get('notes')?.toString().trim();
		if (notes) await db.setSetting(user.id, notes, 'admin:notes');
		if (setting_roles.status !== 200) {
			const {
				status,
				data: { message }
			} = setting_roles as SnappError;

			return fail(status as NumericRange<400, 599>, { message });
		}

		const { active_smtp } = await (await fetch('/api/smtp/test')).json();

		if (active_smtp) {
			const token_id = randomUUID();

			const token = await db.apikeys.save(token_id, {
				id: token_id,
				created: new Date(),
				roles: ['admin'],
				user_id: setting_roles.user.id as string
			});

			await db.redis.expire('apikey:' + token_id, 60);

			const EN = await getLanguage();
			const APP_NAME = EN['global:appname'];
			const EMAIL_OBJECT = EN['emails:invited:object'].replace('{app_name}', APP_NAME);
			const EMAIL_DESCRIPTION = EN['emails:invited:text']
				.replace('{url}', `${env.PUBLIC_URL}/auth/recover-password?token=${token.id}`)
				.replace('{username}', user.username);
			const EMAIL_FOOTER = EN['emails:invited:footer'].replace('{url}', url.origin);

			const OUT_TEXT = EN['emails:global:out:text']
				.replace('{url}', url.origin)
				.replace('{app_name}', APP_NAME);

			const emailForm = new FormData();

			emailForm.set('to', user.email!);
			emailForm.set('app_name', APP_NAME);
			emailForm.set('email_object', EMAIL_OBJECT);
			emailForm.set('email_description', EMAIL_DESCRIPTION);
			emailForm.set('email_footer', EMAIL_FOOTER);
			emailForm.set('outer_text', OUT_TEXT);

			const send_mail = await fetch('/api/smtp/send', {
				headers: {
					authorization: 'Bearer ' + token.id
				},
				method: 'post',
				body: emailForm
			});
		}

		throw redirect(302, '/dashboard/users/');
	}
};
