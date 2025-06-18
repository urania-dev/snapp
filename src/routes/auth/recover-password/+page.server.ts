import { fail, redirect } from '@sveltejs/kit';
import { enhance } from '@zenstackhq/runtime';
import { recoverSchema } from '$lib/components/auth/schema';
import { prisma } from '$lib/db/prisma';
import {
	createSession,
	generateSessionToken,
	invalidateSessions,
	setSessionTokenCookie
} from '$lib/server/auth/index.js';
import { getSettings } from '$lib/server/config/index.js';
import RecoverPasswordEmail from '$lib/server/emails/auth/resetPasswordEmail.svelte';
import { sendEmail } from '$lib/server/smtp';
import { superValidate } from 'sveltekit-superforms';
import { zod } from 'sveltekit-superforms/adapters';
export const load = async ({ locals: { user }, url }) => {
	if (user) redirect(302, '/dashboard');
	const tokenHash = url.searchParams.get('token');
	if (!tokenHash) redirect(302, '/auth/forgot-password');
	return {
		form: await superValidate(zod(recoverSchema)),
		tokenHash
	};
};

export const actions = {
	'forgot-password': async (event) => {
		const form = await superValidate(event, zod(recoverSchema));
		if (!form.valid) {
			return fail(400, {
				form
			});
		}
		const settings = await getSettings();

		const tokenHash = form.data.token;

		const token = await prisma.passwordReset.findFirst({
			where: { tokenHash }
		});

		if (token) await prisma.passwordReset.delete({ where: { tokenHash } });

		if (!token || token.expiresAt <= new Date()) {
			return fail(400, { message: 'errors.auth.reset-token-expired' });
		}

		await invalidateSessions(token.userId);

		const localDB = enhance(prisma, { user: { id: token.userId } });

		const { email } = await localDB.user.update({
			data: { password: form.data.password },
			where: { id: token.userId }
		});

		const sessionId = generateSessionToken();
		const session = await createSession(sessionId, token.userId);
		setSessionTokenCookie(event, sessionId, session.expiresAt);
		const appname = settings.get<string>('appname') || 'Snapp';
		const ip = event.request.headers.get('X-FORWARDED-FOR') || '[no ip traceable.]';

		sendEmail(
			RecoverPasswordEmail,
			{ appname, ip },
			email,
			appname + ' | Requested reset password'
		);

		return {
			form
		};
	}
};
