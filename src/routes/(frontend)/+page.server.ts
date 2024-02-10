import { dev } from '$app/environment';
import { db } from '$lib/db/index.js';
import { redirect } from '@sveltejs/kit';

export async function load({ locals }) {
	const session = await locals.getSession();
	const disabled_home = await db
		.getSetting('settings:app:home:enabled')
		.then((res) => res === 'false');

	if (disabled_home === true) throw redirect(302, '/dashboard');
}

export const actions = {
	async theme({ locals, request, cookies }) {
		const session = await locals.getSession();

		const form = await request.formData();
		const theme = form.get('theme')?.toString();

		cookies.set('snapp:theme', theme ?? 'dark', {
			path: '/',
			httpOnly: true,
			secure: dev ? false : true
		});

		if (!session) return { success: true, theme: theme ?? 'dark' };
		else {
			if (session.user.id === undefined) return;
			const user = await db.users.search().where('id').equalTo(session.user.id).first() as DBUser | null;
			if (user)
				await db.updateUser({ ...user, settings: { ...user.settings, theme: theme ?? 'dark' } });
			return { success: true, mode: theme ?? 'dark' };
		}
	}
};
