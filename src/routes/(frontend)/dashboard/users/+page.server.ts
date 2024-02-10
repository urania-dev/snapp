import getUrlParams from '$lib/api/utils/getUrlParams';
import { db } from '$lib/db';

import { error, redirect } from '@sveltejs/kit';
import { EntityId } from 'redis-om';

export async function load({ locals, url }) {
	const session = await locals.getSession();
	if (!session) throw redirect(302, '/auth/sign-in');
	const is_admin = await db.admin(session.user.id);
	if (!is_admin) throw error(401, { message: 'auth:not:authorized' });
	
	let { page, limit, search, sort, sortDir, offset } = getUrlParams(url);
	let query = db.users.search();

	if (sort && sortDir === 'asc') query.sortAsc(sort);
	if (sort && sortDir === 'desc') query.sortDesc(sort);

	if (search && search !== '')
		query.where('email').does.equal(`*${search}*`).or('username').equal(`*${search}*`);

	const count = await query.returnCount();

	let _limit = await db.getSetting('users:row:count', 'settings:' + session.user.id) ?? 8;
	let _columns = await db.getSetting('users:columns', 'settings:' + session.user.id);

	if (_limit) limit = Number(_limit);
	if (_limit) offset = Number(+(+page - 1) * +limit);
	const users = await query.return.page(offset, limit).then(
		async (users) =>
			await Promise.all(
				users.map(async (user) => {
					delete user.hash;
					const id = user[EntityId]!;

					user.urls = await db.snapps.search().where('user_id').equals(id).returnCount();

					return user as DBUser & { urls: number };
				})
			)
	);

	return {
		count,
		page,
		limit,
		sort,
		active_columns: _columns?.split(',') ?? ['email', 'username', 'roles'],
		sortDirection: sortDir,
		users: (JSON.parse(JSON.stringify(users)) as (DBUser & { urls: number })[]) ?? []
	};
}

export const actions = {
	async deleteIds({ request, locals }) {
		const session = await locals.getSession();
		if (!session) throw redirect(302, '/auth/sign-in');

		const form = await request.formData();
		let _ids = form.get('ids')?.toString();
		let ids = _ids?.split(',') ?? [];

		await db.users.remove(...ids);
		await Promise.all(
			ids.map(async (user) => {
				let ids = (await db.snapps.search().where('user_id').equals(user).returnAllIds()) ?? [];
				await db.snapps.remove(...ids);
			})
		);
		return {
			success: 200,
			message: 'users:selected:removed'
		};
	},
	async saveColumns({ request, locals }) {
		const session = await locals.getSession();

		const form = await request.formData();
		let columns = form.get('columns')?.toString();

		if (!session) throw redirect(302, '/auth/sign-in');
		if (columns) await db.setSetting('users:columns', columns, 'settings:' + session.user.id);

		return { success: true, message: 'settings:app:private:saved' };
	},
	async saveRowsCount({ request, locals }) {
		const session = await locals.getSession();

		const form = await request.formData();
		let _limit = form.get('limit')?.toString();

		if (!session) throw redirect(302, '/auth/sign-in');
		else {
			if (_limit && Number(_limit) < 10000)
				await db.setSetting('users:row:count', _limit, 'settings:' + session.user.id);

			return { success: true, limit: _limit, message: 'settings:app:private:saved' };
		}
	}
};
