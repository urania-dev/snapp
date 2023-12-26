// routes/login/+page.server.ts
import { auth } from '$lib/server/lucia';
import { LuciaError } from 'lucia';
import { fail, redirect } from '@sveltejs/kit';
import { prisma } from '$lib/server/prisma.js';

export async function load({ locals: { auth } }) {
	const session = await auth.validate();
	if (session) throw redirect(302, '/');

	try {
		const findFirst = await prisma.user.findFirst();
		if (findFirst === null) throw redirect(302, '/auth/signup');
	} catch (error) {
		throw redirect(302, '/auth/signup');
	}
}

export const actions = {
	default: async ({ request, locals }) => {
		const formData = await request.formData();
		const username = formData.get('username');
		const password = formData.get('password');
		// basic check
		if (typeof username !== 'string' || username.length < 1 || username.length > 31) {
			return fail(400, {
				username: true,
				password: false,
				message: 'A username is requested'
			});
		}

		if (typeof password !== 'string' || password.length < 1 || password.length > 255) {
			return fail(400, {
				password: true,
				username: false,
				message: 'A password is requested'
			});
		}
		try {
			// find user by key
			// and validate password
			const key = await auth.useKey('username', username.toLowerCase(), password);
			const session = await auth.createSession({
				userId: key.userId,
				attributes: {}
			});
			locals.auth.setSession(session); // set session cookie
		} catch (e) {
			if (
				e instanceof LuciaError &&
				(e.message === 'AUTH_INVALID_KEY_ID' || e.message === 'AUTH_INVALID_PASSWORD')
			) {
				// user does not exist
				// or invalid password
				return fail(400, {
					password: false,
					username: false,
					message: 'Incorrect username or password'
				});
			}
			return fail(500, {
				password: false,
				username: false,
				message: 'An unexpected server error occurred. Please try again later.'
			});
		}
		// redirect to
		// make sure you don't throw inside a try/catch block!
		throw redirect(302, '/dashboard');
	}
};
