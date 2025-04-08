import type { User } from '@prisma/client';

import { error, fail, redirect } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { signUpSchema } from '$lib/components/auth/schema';
import { prisma } from '$lib/db/prisma.js';
import { createSession, generateSessionToken, setSessionTokenCookie } from '$lib/server/auth';
import { createToken } from '$lib/server/auth/db';
import { getSettings } from '$lib/server/config';
import Signup from '$lib/server/emails/auth/signupEmail.svelte';
import { log } from '$lib/server/log';
import { sendEmail } from '$lib/server/smtp';
import { watchLists } from '$lib/server/watchlists';
import { superValidate } from 'sveltekit-superforms';
import { zod } from 'sveltekit-superforms/adapters';

export const load = async ({ locals: { user } }) => {
	if (user) redirect(302, '/');

	const settings = await getSettings();
	const enabledSignup = settings.get<boolean>('ENABLE_SIGNUP');
	const DISABLED_EMAIL_AND_PASSWORD  = process.env.DISABLED_EMAIL_AND_PASSWORD?.toLowerCase() === "true" || false
	
	return {
		emailDisabled:DISABLED_EMAIL_AND_PASSWORD,
		enabledSignup,
		form: await superValidate(zod(signUpSchema))
	};
};

export const actions = {
	signup: async (event) => {
		const form = await superValidate(event, zod(signUpSchema));
		if (!form.valid) {
			return fail(400, {
				form
			});
		}
		try {
			const settings = await getSettings();

			const enabledSignup = settings.get<boolean>('ENABLE_SIGNUP');
			if (!enabledSignup) {
				return fail(401, { form, message: 'errors.auth.disabled-signups' });
			}

			const disabled = process.env.DISABLED_EMAIL_AND_PASSWORD?.toLowerCase() === 'true' || false
			if (disabled) {
				return fail(401, { form, message: 'errors.auth.disabled-auth-email-and-password' });
			}

			const validEmail = await watchLists.checkEmail(form.data.email);
			const validUsername = await watchLists.checkUsername(form.data.username);

			if (!validEmail || !validUsername) {
				return fail(400, { form, message: 'errors.blacklisted.user' });
			}
			const existsMail = await prisma.user.findFirst({
				where: { email: form.data.email }
			});
			const existsUsername = await prisma.user.findFirst({
				where: { username: form.data.username }
			});

			if (existsMail) {
				return fail(400, { form, message: 'errors.auth.email-registered' });
			}
			if (existsUsername) {
				return fail(400, { form, message: 'errors.auth.user-already-exists' });
			}

			const user = await event.locals.prisma.user.create({
				data: {
					email: form.data.email,
					password: form.data.password,
					username: form.data.username,
					verified: false
				}
			});

			if (!user) throw error(500, { message: 'errors.generic' });

			const sessionId = generateSessionToken();
			const session = await createSession(sessionId, user.id);

			setSessionTokenCookie(event, sessionId, session.expiresAt);

			const name = user.username;
			const origin = event.url.origin;
			origin.replaceAll('http', 'https');

			const verifyEmailToken = createToken({
				id: user.id,
				role: user.role
			} as User);

			const cta = origin + '/auth/verify-email?token=' + verifyEmailToken;
			const appname = settings.get<string>('appname') || 'Snapp';

			await sendEmail(
				Signup,
				{ appname, cta, name },
				form.data.email,
				appname + ' | Welcome to our platform'
			);
		} catch (error) {
			if (env.LOG_LEVEL === 'debug') log.error(error);
		}

		return {
			form
		};
	}
};
