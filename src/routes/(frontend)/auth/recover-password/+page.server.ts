import getLanguage from '$lib/api/utils/getLanguage.js';
import { db } from '$lib/db/index.js';
import { fail, redirect } from '@sveltejs/kit';
import { randomUUID } from 'crypto';
import bcrypt from 'bcrypt';
import { env } from '$env/dynamic/public';
export async function load({ fetch, url }) {
	const { active_smtp } = await (await fetch('/api/smtp/test')).json();
	if (!active_smtp) throw redirect(302, '/auth/sign-in');
	const token = url.searchParams.get('token')?.toString().trim();
	return { token };
}
export const actions = {
	async sendMail({ locals, request, fetch, url }) {
		const session = await locals.getSession();
		if (session) throw redirect(302, '/');
		const form = await request.formData();
		const username = form.get('username')?.toString();
		if (!username) return fail(400, { username: true, message: 'auth:username:unset' });
		const user = (await db.users
			.search()
			.where('email')
			.equal(username)
			.or('username')
			.equal(username)
			.first()) as DBUser | null;

		const newKeyId = randomUUID();
		if (user) {
			await db.apikeys.save(newKeyId, {
				id: newKeyId,
				created: new Date(),
				roles: user.roles as string[],
				user_id: user.id as string
			});
			await db.apikeys.expireAt(newKeyId, new Date(new Date().getTime() + 60 * 10 * 1000));
		} else return fail(404, { message: 'auth:user:not:found', username: false });

		const EN = await getLanguage();
		const APP_NAME = EN['global:appname'];
		const EMAIL_OBJECT = EN['emails:recover:password:object'];
		const EMAIL_DESCRIPTION = EN['emails:recover:password:text']
			.replace('{url}', `${env.PUBLIC_URL}/auth/recover-password?token=${newKeyId}`)
			.replace('{username}', user.username);
		const EMAIL_FOOTER = EN['emails:recover:password:footer'].replace('{url}', url.origin);

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

		await fetch('/api/smtp/send', {
			headers: {
				authorization: 'Bearer ' + newKeyId
			},
			method: 'post',
			body: emailForm
		});

		return { username: false, success: true, message: 'auth:recover:mail:sent' };
	},
	async resetPassword({ locals, request }) {
		const session = await locals.getSession();
		if (session) throw redirect(302, '/');
		const form = await request.formData();
		const password = form.get('password')?.toString();
		const confirmPassword = form.get('confirm_password')?.toString();
		const token = form.get('token')?.toString();
		if (!token)
			return fail(401, { message: 'auth:token:expired', password: false, confirmPassword: false });
		if (!password)
			return fail(400, { password: true, confirmPassword: false, message: 'auth:password:unset' });

		const apikey = (await db.apikeys
			.search()
			.where('id')
			.equalTo(token)
			.first()) as DBAPIKey | null;

		if (!apikey)
			return fail(401, { message: 'auth:token:expired', password: false, confirmPassword: false });
		const user = (await db.users
			.search()
			.where('id')
			.equalTo(apikey.user_id)
			.first()) as DBUser | null;

		if (!user)
			return fail(401, { message: 'auth:user:not:found', password: false, confirmPassword: false });

		if (typeof password !== 'string' || password.trim() === '')
			return fail(400, { message: 'auth:password:unset', password: true, confirmPassword: false });
		if (
			/^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$%^&\_\,*-]).{8,}$/.test(password) === false
		)
			return fail(400, {
				password: true,
				confirmPassword: true,
				message: 'auth:password:guidelines'
			});

		if (!confirmPassword)
			return fail(401, { message: 'auth:password:unmatch', confirmPassword: true, password: true });

		if (password !== confirmPassword)
			return fail(400, {
				message: 'auth:password:unmatch',
				password: true,
				confirmPassword: true
			});
		const hash = await bcrypt
			.genSalt(10)
			.then((salt) => bcrypt.hash(password as string, salt))
			.then((hash) => hash);
		await db.users.save(user.id, { ...user, hash: hash, updated: new Date() });
		throw redirect(302, '/');
	}
};
