import { fail, redirect } from '@sveltejs/kit';
import { signInSchema } from '$lib/components/auth/schema';
import { prisma } from '$lib/db/prisma';
import { generateSessionToken } from '$lib/server/auth/index.js';
import { createSession } from '$lib/server/auth/index.js';
import { setSessionTokenCookie } from '$lib/server/auth/index.js';
import { getProviders } from '$lib/server/auth/oidc/config';
import { watchLists } from '$lib/server/watchlists';
import { logInvalidLoginAttempt } from '$lib/umami';
import bcrypt from 'bcryptjs';
import { superValidate } from 'sveltekit-superforms';
import { zod } from 'sveltekit-superforms/adapters';

export const load = async ({ locals: { user } }) => {
	if (user) redirect(302, '/dashboard');

	const OIDCConfigs = await getProviders();
	const providers = OIDCConfigs.map((o) => ({ identity: o.identity }));
	const DISABLED_EMAIL_AND_PASSWORD =
		process.env.DISABLED_EMAIL_AND_PASSWORD?.toLowerCase() === 'true' || false;

	return {
		emailDisabled: DISABLED_EMAIL_AND_PASSWORD,
		form: await superValidate(zod(signInSchema)),
		providers
	};
};

export const actions = {
	signin: async (event) => {
		const form = await superValidate(event, zod(signInSchema));
		if (!form.valid) {
			return fail(400, {
				form
			});
		}
		const auth = await prisma.user.findFirst({
			where: { username: form.data.username }
		});

		if (!auth) {
			return fail(400, { form, message: 'errors.auth.user-not-found' });
		}

		const disabled = process.env.DISABLED_EMAIL_AND_PASSWORD?.toLowerCase() === 'true' || false;
		if (disabled) {
			return fail(401, { form, message: 'errors.auth.disabled-auth-email-and-password' });
		}

		const validEmail = await watchLists.checkEmail(auth.email);
		const validUsername = await watchLists.checkUsername(form.data.username);

		if (!validEmail || !validUsername)
			return fail(400, { form, message: 'errors.auth.blacklisted' });

		const validPassword = bcrypt.compareSync(form.data.password, auth.password);

		if (!validPassword) {
			logInvalidLoginAttempt(event);
			return fail(400, { form, message: 'errors.auth.wrong-credentials' });
		}

		const sessionId = generateSessionToken();
		const session = await createSession(sessionId, auth.id);

		await prisma.user.update({
			data: { updatedAt: new Date().toISOString() },
			where: { id: auth.id }
		});

		setSessionTokenCookie(event, sessionId, session.expiresAt);

		return {
			form
		};
	}
};
