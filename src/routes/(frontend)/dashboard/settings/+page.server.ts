import { db } from '$lib/db';
import type SnappError from '$lib/db/utils/snappError.js';
import { error, fail, redirect } from '@sveltejs/kit';
import { randomUUID } from 'crypto';
import { EntityId } from 'redis-om';

export async function load({ locals, depends }) {
	depends('snapp:settings');
	const session = await locals.getSession();
	if (!session) throw redirect(302, '/auth/sign-in');

	const id = session.user.id;
	const user = (await db.users.search().where('id').equal(id).first()) as DBUser;
	if (!user) throw error(404, { message: 'auth:user:not:found' });

	const settings = {
		theme: locals.theme,
		lang: locals.lang,
		isAdmin: user.roles.includes('admin'),
		isSuperAdmin: user.roles.includes('superadmin')
	};

	const apikey = await db.apikeys.search().where('user_id').equal(session.user.id).first();

	return {
		session,
		settings,
		user: {
			email: user.email,
			username: user.username,
			apikey: apikey?.[EntityId],
			apikey_created: +(apikey?.created ?? 0)
		}
	};
}

export const actions = {
	async lang({ locals, request }) {
		const session = await locals.getSession();
		if (!session) throw redirect(302, '/auth/login');
		const form = await request.formData();

		const lang = form.get('lang')?.toString();
		if (!lang)
			return fail(400, {
				message: 'global:system:error',
				lang: lang ?? 'lang-is-missing'
			});
		const user = (await db.users.fetch(session.user.id)) as DBUser;
		const update = await db.updateUser({ ...user, settings: { ...user.settings, lang } });

		if (update.status !== 200) {
			const { status, data } = update as SnappError;
			return fail(status, data);
		} else return update;
	},
	async saveProfile({ locals, request }) {
		const session = await locals.getSession();
		if (!session) throw redirect(302, '/auth/login');

		const form = await request.formData();

		const username = form.get('username')?.toString()?.trim();
		const password = form.get('password')?.toString()?.trim();
		const email = form.get('email')?.toString()?.toString()?.trim();

		const update = await db.updateUser({ username, email, password, id: session.user.id });

		if (update.status !== 200) {
			const { status, data } = update as SnappError;
			return fail(status, data);
		} else return update;
	},

	async apiKeys({ request, locals }) {
		const session = await locals.getSession();
		if (!session) throw redirect(302, '/auth/login');

		const form = await request.formData();

		const apikey = form.get('apikey')?.toString();
		if (!apikey || apikey.trim() === '') {
			const user = await db.users.fetch(session.user.id);
			if (!user) return fail(404, { message: 'auth:user:not:found' });

			const newKeyId = randomUUID();

			await db.apikeys.save(newKeyId, {
				id: newKeyId,
				created: new Date(),
				roles: user.roles as string[],
				user_id: user.id as string
			});

			return { newKeyId };
		} else {
			await db.apikeys.remove(apikey);

			return { newKeyId: null };
		}
	}
};
