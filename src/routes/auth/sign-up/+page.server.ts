import { database } from '$lib/server/db/database';
import { EMAIL_EXISTS, ENABLED_SIGNUP, USER_EXISTS } from '$lib/utils/constants.js';
import { fail, redirect } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { SMTP_FROM, SMTP_HOST, SMTP_PASS, SMTP_PORT, SMTP_USER } from '$lib/utils/constants.js';
import { createTransport, type Transport, type TransportOptions } from 'nodemailer';
import { join } from 'path'
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
export async function load({ locals: { session } }) {
	if (session) redirect(302, '/');
	const enabled_signup = database.settings.parse(await database.settings.get(ENABLED_SIGNUP), true);

	return { enabled_signup };
}

export const actions = {
	default: async ({ request, cookies, url }) => {
		const form = await request.formData();

		const username = form.get('username')?.toString();
		const email = form.get('email')?.toString();
		const password = form.get('password')?.toString();
		const confirm_password = form.get('confirm-password')?.toString();

		if (
			!email ||
			typeof email !== 'string' ||
			!/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/.test(email) ||
			!email.trim().length
		)
			return fail(400, { message: 'errors.auth.email-invalid' });
		if (!username || typeof username !== 'string' || !username.trim().length)
			return fail(400, { message: 'errors.auth.username-invalid' });
		if (
			!password ||
			typeof password !== 'string' ||
			!password.trim().length ||
			!/^(?=.*\d)(?=.*[A-Z])(?=.*[a-z])(?=.*[^\w\d])([^\s]){8,}$/.test(password.trim())
		)
			return fail(400, { message: 'errors.auth.password-invalid' });
		if (
			!confirm_password ||
			typeof confirm_password !== 'string' ||
			!confirm_password.trim().length ||
			confirm_password !== password
		)
			return fail(400, { message: 'errors.auth.password-unmatch' });

		const enabled_signup = database.settings.parse(
			await database.settings.get(ENABLED_SIGNUP),
			true
		);
		if (!enabled_signup) return fail(401, { message: 'errors.auth.disabled-signups' });

		const [email_user, email_provider] = email.split('@');
		const is_email_allowed = await database.watchlist.check(email_provider, email_user);
		const is_username_allowed = await database.watchlist.check(null, username);
		if (!is_email_allowed || !is_username_allowed)
			return fail(400, { message: 'errors.blacklisted.user' });

		const [user, err] = await database.users.create(username, email, password, cookies);

		let message = null;
		if (err && err === USER_EXISTS) message = 'errors.auth.user-already-exists';
		if (err && err === EMAIL_EXISTS) message = 'errors.auth.email-registered';
		if (!user || message) return fail(500, { message });

		try {
			const configPath = join(process.cwd(), 'smtp.config.cjs');
			let smtpConfig = require(configPath) as (_database:typeof database) => Promise<any>;
			const smtp = await smtpConfig(database)

			const from = await database.settings.get(SMTP_FROM).then((res) => res?.value) || smtp.auth.user;
			const transporter = createTransport<Transport>({ ...smtp } as TransportOptions);

			const html = String((await import('$lib/emails/welcome.html?raw')).default);

			const APPNAME = env.APPNAME || 'Snapp.li';
			const ORIGIN_URL = env.ORIGIN;
			const LOGO_URL = url.origin + '/logo.svg';
			const NAME = user.username;
			const URL = url.origin + '/dashboard';

			const flag = await transporter.sendMail({
				from: APPNAME + ' <' + from + '>',
				to: user.email,
				subject: 'Snapp: Welcome to our platform!',
				html: html
					.replaceAll('{APP_NAME}', APPNAME)
					.replaceAll('{ORIGIN_URL}', ORIGIN_URL)
					.replaceAll('{LOGO_URL}', LOGO_URL)
					.replaceAll('{NAME}', NAME)
					.replaceAll('{URL}', URL)
			});
		} catch (error) {
			console.log(error);
		}

		redirect(302, '/');
	}
};
