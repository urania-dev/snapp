import { redirect } from '@sveltejs/kit';
import { createToken } from '$lib/server/auth/db.js';
import { getConfig, getSettings } from '$lib/server/config';
import VerificationEmail from '$lib/server/emails/auth/verificationEmail.svelte';
import { sendEmail } from '$lib/server/smtp/index.js';
import jwt from 'jsonwebtoken';

export const load = async ({ locals: { prisma, user }, url }) => {
	if (!user) redirect(302, '/auth/sign-in');
	if (user.verified === true) redirect(302, '/dashboard');

	const config = getConfig();

	const token = url.searchParams.get('token')?.toString();
	if (!token) return {};

	try {
		const verified = jwt.verify(token, config['TOKEN_SECRET'] as string);
		if (typeof verified !== 'string' && verified.exp && verified.exp <= new Date().getTime()) {
			await prisma.user.update({
				data: { verified: true },
				where: { id: user.id }
			});
		}
	} catch (e) {
		return {
			message: (e as Error)?.message
		};
	}

	redirect(302, '/dashboard');
};

export const actions = {
	'resend-email': async ({ locals: { user }, request, url }) => {
		if (!user) redirect(302, '/auth/sign-in');
		const settings = await getSettings();
		const token = createToken(user, '1d');
		const cta = `${url.origin}/auth/verify-email?token=${token}`;
		const appname = settings.get<string>('appname') || 'Snapp';
		const ip = request.headers.get('X-FORWARDED-FOR') || '[no ip traceable.]';

		sendEmail(
			VerificationEmail,
			{ appname, cta, ip, name: user.username },
			user.email,
			appname + ' | Verify your account email'
		);
	}
};
