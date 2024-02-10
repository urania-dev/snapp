import authenticate from '$lib/api/utils/authenticate.js';
import getLanguage from '$lib/api/utils/getLanguage.js';
import getUrlParams from '$lib/api/utils/getUrlParams.js';
import { db } from '$lib/db/index.js';
import type SnappError from '$lib/db/utils/snappError.js';
import { slugify } from '$lib/utils/slugify/index.js';
import { error, json, type NumericRange } from '@sveltejs/kit';

import type { RedisOmError } from 'redis-om';

export async function GET({ request, url }) {
	const EN = await getLanguage();

	const apiKey = await authenticate(request, EN);

	if (!apiKey.roles.includes('admin') || !apiKey.roles.includes('superadmin'))
		throw error(401, { message: EN['auth:not:authorized'] });
	
	const { page, limit, search, sort, sortDir, offset } = getUrlParams(url);
	let query = db.users.search();

	if (sort && sortDir === 'asc') query.sortAsc(sort);
	if (sort && sortDir === 'desc') query.sortDesc(sort);

	if (search && search !== '')
		query
			.and('username')
			.equal('*' + search + '*')
			.or('email')
			.equal('*' + search + '*');

	interface DBUserEnriched extends DBUser {
		notes?: string;
	}
	try {
		const count = await query.returnCount();
		const users = await query.return.page(offset, limit).then((users) =>
			Promise.all(
				(users as unknown as DBUserEnriched[]).map(async (user) => {
					let notes = await db.getSetting(user.id, 'admin:notes');
					
					delete user.hash;
					user.notes = notes;
					return user;
				})
			)
		);

		return json(
			{ count, page, limit, sort, sortDirection: sortDir, data: users },
			{
				headers: {
					'Content-Type': 'application/json',
					'cache-control': 'max-age=' + 60 * 60
				}
			}
		);
	} catch (err) {
		throw error(500, { message: (err as RedisOmError)?.message });
	}
}

export async function POST({ request }) {
	const EN = await getLanguage();
	const apiKey = await authenticate(request, EN);
	if (!apiKey.roles.includes('admin') || !apiKey.roles.includes('superadmin'))
		throw error(401, { message: EN['auth:not:authorized'] });

	const form = await request?.formData();
	const username = form.get('username')?.toString();
	const email = form.get('email')?.toString();
	const password = form.get('password')?.toString();
	const confirmPassword = form.get('confirm_password')?.toString();

	const create = await db.signupUser({ username, email, password, confirmPassword });
	if (create.status !== 200) {
		const EN = await getLanguage();
		const {
			status,
			data: { message }
		} = create as SnappError;
		throw error(status as NumericRange<400, 599>, { message: EN[message] });
	} else return json(create);
}

export async function PATCH({ request }) {
	const EN = await getLanguage();
	await authenticate(request, EN);
	const form = await request?.formData();
	const id = form.get('id')?.toString();
	if (!id) throw error(400, { message: EN['api:user:id:unset'] });
	const apiKey = await authenticate(request);
	if (
		apiKey.user_id !== id &&
		(!apiKey.roles.includes('admin') || !apiKey.roles.includes('superadmin'))
	)
		throw error(401, { message: EN['auth:not:authorized'] });

	const username = form.get('username')?.toString()?.trim();
	const email = form.get('email')?.toString();
	const password = form.get('password')?.toString();
	const notes = form.get('notes')?.toString();

	const roles: string[] = form.get('roles')?.toString()?.replaceAll(' ', '')?.split(',') ?? [];

	const update = await db.updateUser({
		id,
		username: username ? slugify(username) : undefined,
		email,
		password,
		roles
	});
	if (notes) await db.setSetting(id, notes, 'admin:notes');

	if (update.status !== 200) {
		const EN = await getLanguage();
		const {
			status,
			data: { message }
		} = update as SnappError;
		throw error(status as NumericRange<400, 599>, { message: EN[message] });
	} else return json({ ...update, notes, message: EN[(update as { message: string }).message] });
}

export async function DELETE({ request, url }) {
	const EN = await getLanguage();
	await authenticate(request, EN);

	const ids =
		url.searchParams.get('ids')?.toString()?.trim()?.replaceAll(' ', '')?.split(',') ?? [];
	const id = url.searchParams.get('id')?.toString().trim()?.replaceAll(' ', '') ?? null;
	const new_owner = url.searchParams.get('new-owner-id')?.toString();

	if ((!ids || ids.length === 0) && !id) throw error(400, { message: EN['api:user:ids:unset'] });

	const apiKey = await authenticate(request);

	if (!apiKey.roles.includes('admin') || !apiKey.roles.includes('superadmin'))
		throw error(401, { message: EN['auth:not:authorized'] });

	const _ids = Array.from(new Set([...ids, id])).filter((id) => id !== null) as string[];
	const deleted = await db.deleteUser(..._ids);
	await Promise.all(
		_ids.map(async (user) => {
			let ids = (await db.snapps.search().where('user_id').equals(user).returnAllIds()) ?? [];
			await db.snapps.remove(...ids);
		})
	);
	if (deleted.status !== 200) {
		const EN = await getLanguage();
		const {
			status,
			data: { message }
		} = deleted as SnappError;
		throw error(status as NumericRange<400, 599>, { message: EN[message] });

		// TODO: Cascade
	} else if (new_owner && typeof new_owner === 'string') {
	}

	return json({ ...deleted, message: EN[(deleted as { message: string }).message] });
}
