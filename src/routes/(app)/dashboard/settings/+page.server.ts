import { auth } from '$lib/server/lucia.js';
import { prisma } from '$lib/server/prisma.js';
import { fail, redirect } from '@sveltejs/kit';

export async function load({ locals, depends }) {
	depends('snapp:settings');
	const session = await locals.auth.validate();
	if (session === null) throw redirect(302, '/auth/signup');

	const user = await prisma.user.findFirst({
		where: { id: session.user.userId },
		include: { settings: true }
	});

	return {
		user,
		isAdmin: Boolean(user?.settings.find((s) => s.setting === 'administrator')?.value ?? false)
	};
}

export const actions = {
	async newMail({ locals, request }) {
		const session = await locals.auth.validate();
		if (!session) throw redirect(302, '/');

		const form = await request.formData();

		const email = form.get('email') as string | null;
		console.log({ email });
		if (!email) return fail(400, { message: 'Email not set', email: true, emailForm: true });
		console.log({ email });
		await auth.updateUserAttributes(session.user.userId, { email });

		return { newMail: email, message: 'Mail is updated', success: true };
	},
	async newPassword({ locals, request }) {
		const session = await locals.auth.validate();

		if (!session) throw redirect(302, '/auth/login');

		const form = await request.formData();

		const user = await prisma.user.findUnique({ where: { id: session.user.userId } });

		if (!user)
			return fail(404, {
				message: 'User not found',
				masterPassword: false,
				username: true,
				password: false,
				confirmPassword: false,
				passwordForm: true
			});

		const password = form.get('password') as string | null;
		const confirmPassword = form.get('confirm-password') as string | null;

		if (!password || !confirmPassword || confirmPassword !== password) {
			return fail(404, {
				message: 'Password is not set or are not matching',
				masterPassword: false,
				username: false,
				password: true,
				confirmPassword: true,
				passwordForm: true
			});
		}
		try {
			await auth.updateKeyPassword('username', session.user.username.toLowerCase(), password);
		} catch (error) {
			throw error;
		}

		return { success: true, message: 'New password has been set' };
	}
};
