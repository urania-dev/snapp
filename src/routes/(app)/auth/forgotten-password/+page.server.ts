import { createTransport } from 'nodemailer';

import { prisma } from '$lib/server/prisma.js';
import { fail, redirect } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { env as publicEnv } from '$env/dynamic/public';
import { auth } from '$lib/server/lucia.js';

export async function load({ locals, parent }) {
	const session = await locals.auth.validate();
	if (session) throw redirect(302, '/');

	const { has_smtp } = await parent();
	console.log(has_smtp)
	if (!has_smtp) throw redirect(302, '/auth/login');
	try {
		const findFirst = await prisma.user.findFirst();
		if (findFirst === null) throw redirect(302, '/auth/signup');
	} catch (error) {
		throw redirect(302, '/auth/signup');
	}
}

export const actions = {
	async default({ request }) {
		const form = await request.formData();

		const username = form.get('username') as string | null;
		const email = form.get('email') as string | null;
		if (!username)
			return fail(400, {
				message: 'Username not set',
				email: false,
				username: true,
				password: false,
				confirmPassword: false
			});

		const user = await prisma.user.findFirst({ where: { username } });

		if (!user)
			return fail(404, {
				message: 'User not found',
				email: false,
				username: true,
				password: false,
				confirmPassword: false
			});

		if (user.email !== email)
			return fail(404, {
				message: 'This account has been registered with a different email account',
				email: false,
				username: false,
				password: false,
				confirmPassword: false
			});

		const transporter = createTransport({
			host: env.SMTP_HOST,
			port: Number(env.SMTP_PORT),
			secure: true,
			auth: {
				user: env.SMTP_USER,
				pass: env.SMTP_PASSWORD
			}
		});

		const session_token = await auth.createSession({
			userId: user.id,
			attributes: {}
		});

		let html = (await import('./email.html?raw')).default.replace(
			'HREF_TO_REPLACE',
			publicEnv.PUBLIC_URL + '/auth/reset-password?token=' + session_token.sessionId
		);

		if (user.email && email === user.email) {
			const flag = await transporter.sendMail({
				from: `Snapp Url Shortner <${env.SMTP_FROM}>`,
				to: user.email,
				subject: 'Password Recovery',
				html
			});

			console.log(flag);
		}

		return { success: true };
	}
};
