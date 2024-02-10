import { db } from '$lib/db/index.js';
import type SnappError from '$lib/db/utils/snappError.js';
import { error, fail, redirect, type NumericRange } from '@sveltejs/kit';
import { randomUUID } from 'crypto';
import type { Actions } from './$types';
import { generateRandomString } from '$lib/utils/randomString';

export async function load({ locals, params: { id } }) {
	const session = await locals.getSession();
	if (!session) throw redirect(302, '/auth/sign-in');
	const is_admin = await db.admin(session.user.id);
	if (!is_admin) throw error(401, { message: 'auth:not:authorized' });

	const user = (await db.users
		.search()
		.where('id')
		.equal(id)
		.first()
		.then((res) => {
			delete res?.hash;
			return JSON.parse(JSON.stringify(res));
		})) as DBUser | undefined;
	if (!user) throw error(404, { message: 'auth:user:not:found' });
	const notes = await db.getSetting(user.id, 'admin:notes');

	return {
		user,
		notes,
		isAdmin: user.roles.includes('admin') || user.roles.includes('superadmin'),
		app_settings: {
			limits: {
				enabled: (await db.getSetting('settings:app:limits:enabled')) === 'true',
				max: {
					urls: await db.getSetting('settings:app:limits:max:urls').then((res) => {
						if (Number(res) === 0) return undefined;
						else return Number(res);
					}),
					rpd: await db.getSetting('settings:app:limits:max:rpd').then((res) => {
						if (Number(res) === 0) return undefined;
						else return Number(res);
					}),
					rpm: await db.getSetting('settings:app:limits:max:rpm').then((res) => {
						if (Number(res) === 0) return undefined;
						else return Number(res);
					})
				}
			}
		}
	};
}

export const actions: Actions = {
	async update({ request, locals, params: { id } }) {
		const session = await locals.getSession();
		if (!session) throw redirect(302, '/auth/sign-in');

		const form = await request.formData();

		const username = form.get('username')?.toString()?.trim();
		const email = form.get('email')?.toString()?.trim();
		const is_admin = form.get('is_admin')?.toString()?.trim();
		if (!username) return fail(400, { message: 'auth:username:unset' });
		if (!email) return fail(400, { message: 'auth:email:unset' });

		const user = await db.users.search().where('id').equals(id).first();
		if (!user) return fail(400, { message: 'auth:user:not:found' });

		const roles = is_admin === 'true' ? [...user.roles as string[], 'admin'] : ['user'];

		if (username) user.username = username;
		if (email) user.email = email;

		const setting_roles = await db.updateUser({ ...user, roles });
		const notes = form.get('notes')?.toString().trim();
		if (notes) await db.setSetting(user.id as string, notes, 'admin:notes');
		if (setting_roles.status !== 200) {
			const {
				status,
				data: { message }
			} = setting_roles as SnappError;

			return fail(status as NumericRange<400, 599>, { message });
		} else return JSON.parse(JSON.stringify({ ...setting_roles, message: 'users:updated' }));
	}
};
