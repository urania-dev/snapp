import { env } from '$env/dynamic/private';
import { auth } from '$lib/server/lucia.js';
import { prisma } from '$lib/server/prisma.js';
import { error, fail, redirect } from '@sveltejs/kit';

export async function load({ url, parent }) {
	const token = url.searchParams.get('token') as string | null;
	if (!token) throw error(400, { message: 'There is not token set' });
	const session = await auth.getSession(token);
	const { has_smtp } = await parent();
	if (!has_smtp) {
		await auth.invalidateSession(token);
		throw redirect(302, '/auth/login');
	}
	return {
		session
	};
}

export const actions = {
	async default({ request, locals, url }) {
		const form = await request.formData();

		const token = url.searchParams.get('token') as string | null;
		if (!token) throw error(400, { message: 'There is not token set' });
		const session = await auth.getSession(token);

		const username = session?.user.username;
		if (!username)
			return fail(400, {
				message: 'Username not set',
				masterPassword: false,
				username: true,
				password: false,
				confirmPassword: false
			});

		const user = await prisma.user.findFirst({ where: { username } });

		if (!user)
			return fail(404, {
				message: 'User not found',
				masterPassword: false,
				username: true,
				password: false,
				confirmPassword: false
			});

		const password = form.get('password') as string | null;
		const confirmPassword = form.get('confirm-password') as string | null;

		if (!password || !confirmPassword || confirmPassword !== password) {
			return fail(404, {
				message: 'Password is not set or are not matching',
				masterPassword: false,
				username: false,
				password: true,
				confirmPassword: true
			});
		}
		try {
			await auth.updateKeyPassword('username', username.toLowerCase(), password);
		} catch (error) {
			throw error;
		}
		// invalidate mail token as it has been used
		await auth.invalidateSession(token);
		throw redirect(302, '/auth/login');
	}
};
