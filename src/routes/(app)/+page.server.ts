import { dev } from '$app/environment';
import { prisma } from '$lib/server/prisma.js';
import { fail, redirect } from '@sveltejs/kit';

export const actions = {
	'save-theme': async function ({ locals, request, cookies }) {
		const session = await locals.auth.validate();
		if (!session) throw redirect(302, '/');
		const form = await request.formData();
		let theme = form.get('theme') as string | null;

		if (theme === null) return fail(400, { message: 'Server Error' });
		cookies.delete('u:snappli:theme');
		cookies.set('u:snappli:theme', theme, {
			path: '/',
			httpOnly: false,
			secure: !dev,
			maxAge: 60 * 60 * 25 * 30 * 12
		});

		const upsert = await prisma.settings.upsert({
			create: {
				id: session.user.userId + ':theme',
				user_id: session.user.userId,
				setting: 'theme',
				value: theme
			},
			update: {
				value: theme
			},
			where: {
				id: session.user.userId + ':theme'
			}
		});


		return {};
	}
};
