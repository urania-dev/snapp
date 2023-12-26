import { auth } from '$lib/server/lucia.js';
import { prisma } from '$lib/server/prisma.js';
import { fail, redirect } from '@sveltejs/kit';
import { LuciaError } from 'lucia';

export let actions = {
	async default({ request, locals }) {
		const session = await locals.auth.validate();
		if (session !== null) throw redirect(302, '/');

		const administrator = await prisma.user.findFirst();

		if (administrator && process.env.ENABLE_MULTIUSER === 'false') {
			return fail(403, {
				message: 'There is already an administrator registered. Enable mulituser, if intended.',
				email: false,
				password: false,
				username: false,
				confirmPassword: false
			});
		}

		const form = await request.formData();

		const username = form.get('username') as string | null;
		const password = form.get('password') as string | null;
		const email = form.get('email') as string | null;
		const confirmPassword = form.get('confirm-password') as string | null;

		if (typeof username !== 'string' || username.length < 4 || username.length > 31) {
			return fail(400, {
				username: true,
				email: false,
				password: false,
				confirmPassword: false,
				message: 'A Username is requested'
			});
		}
		if (typeof password !== 'string' || password.length < 6 || password.length > 255) {
			return fail(400, {
				username: false,
				email: false,
				password: true,
				confirmPassword: false,
				message: 'At least six digit password is requested'
			});
		}
		if (typeof confirmPassword !== 'string' || confirmPassword !== password) {
			return fail(400, {
				email: false,
				username: false,
				password: true,
				confirmPassword: true,
				message: 'Passwords are not matching'
			});
		}

		try {
			const user = await auth.createUser({
				key: {
					providerId: 'username', // auth method
					providerUserId: username.toLowerCase(), // unique id when using "username" auth method
					password // hashed by Lucia
				},
				attributes: {
					username,
					email
				}
			});
			const session = await auth.createSession({
				userId: user.userId,
				attributes: {}
			});

			if (administrator === null)
				await prisma.settings.upsert({
					create: {
						id: session.user.userId + ':isadmin',
						user_id: session.user.userId,
						setting: 'administrator',
						value: 'true'
					},
					update: {
						value: 'true'
					},
					where: {
						id: session.user.userId + ':isadmin'
					}
				});

			locals.auth.setSession(session); // set session cookie
		} catch (e) {
			// this part depends on the database you're using
			// check for unique constraint error in user table
			if (e instanceof LuciaError && e.message === 'AUTH_DUPLICATE_KEY_ID') {
				return fail(400, {
					email: false,
					username: true,
					password: false,
					confirmPassword: false,
					message: 'Username already taken'
				});
			}

			return fail(500, {
				email: false,
				username: false,
				password: false,
				confirmPassword: false,
				message: 'An unexpected server error occurred. Please try again later.'
			});
		}
		// redirect to
		// make sure you don't throw inside a try/catch block!
		throw redirect(302, '/dashboard');
	}
};
