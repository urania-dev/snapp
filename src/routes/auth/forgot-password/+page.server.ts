import { env } from '$env/dynamic/private';
import { database } from '$lib/server/db/database';
import { SMTP_FROM, SMTP_HOST, SMTP_PASS, SMTP_PORT, SMTP_USER } from '$lib/utils/constants.js';
import { fail, redirect } from '@sveltejs/kit';
import { createTransport, type Transport, type TransportOptions } from 'nodemailer';

export function load({ locals: { session } }) {
	if (session) redirect(302, '/');
}

export const actions = {
	default: async ({ request, cookies, url }) => {
		const form = await request.formData();

		const email = form.get('email')?.toString();
		if (!email || typeof email !== 'string' || !email.trim().length)
			return fail(400, { message: 'errors.auth.email-invalid' });
		const [email_user, email_provider] = email.split('@');
		const is_email_allowed = await database.watchlist.check(email_provider, email_user);
		if (!is_email_allowed) return fail(400, { message: 'errors.blacklisted.user' });

		const [user] = await database.users.one(undefined, email);

		let message = null;
		if (!user) message = 'errors.auth.user-not-found';
		if (message) return fail(500, { message });

		try {
			const smtp = {
				host: await database.settings.get(SMTP_HOST).then((res) => res?.value),
				port: await database.settings.get(SMTP_PORT).then((res) => res?.value),
				secure: true,
				auth: {
					user: await database.settings.get(SMTP_USER).then((res) => res?.value),
					pass: await database.settings.get(SMTP_PASS).then((res) => res?.value)
				}
			};

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

			return { sent: true };
		} catch (error) {
			console.log(error);
			return { sent: false };
		}
	}
};
