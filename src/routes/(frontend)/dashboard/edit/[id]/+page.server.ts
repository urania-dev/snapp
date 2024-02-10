import { db } from '$lib/db/index.js';
import type SnappError from '$lib/db/utils/snappError.js';
import { error, fail, redirect, type NumericRange } from '@sveltejs/kit';
import bcrypt from 'bcrypt';
import type { Actions } from './$types';
import { EntityId } from 'redis-om';
import { extractDomain } from '$lib/db/snapps/shorten';

export async function load({ locals, parent, params: { id } }) {
	const session = await locals.getSession();

	if (!session) throw redirect(302, '/auth/sign-in');
	const data = await parent();
	const user = (await db.users.search().where('id').equal(session.user.id).first()) as DBUser;

	const isAdmin = await db.admin(session.user.id);
	const url = await db.snapps.fetch(id).then(async (res) => {
		if (!res.created) throw error(404, { message: 'snapps:not:found' });

		delete res.secret;
		const id = res[EntityId]!;
		const ttl = await db.redis.ttl('snapps:' + id);
		res.ttl = ttl !== -1
			? (new Date(new Date().getTime() + Number(ttl)).toISOString() as string)
			: undefined;

		res.status = 'active';

		if (res.max_usages && res.used && Number(res.max_usages) <= Number(res.used))
			res.status = 'disabled';
		if (await db.blacklisted({ domain: extractDomain(res.original_url as string)! }))
			res.status = 'blacklisted';
		res.used = res.used ?? 0;

		return res as DBSnapp as DBSnappEnriched;
	});

	if (!isAdmin && user.id !== url.user_id) throw error(401, { message: 'auth:not:authorized' });
	return {
		url: JSON.parse(JSON.stringify(url)) as DBSnappEnriched,
		max_urls: user.settings?.max?.urls ?? data.max_urls ?? 0,
		existing: await db.snapps.search().where('user_id').equal(session.user.id).returnCount(),
		isAdmin: (typeof isAdmin === 'boolean' && isAdmin) || false
	};
}

export const actions: Actions = {
	async edit({ request, locals, fetch, params: { id } }) {
		const session = await locals.getSession();
		if (!session) throw redirect(302, '/auth/sign-in');

		let editSnapp = await db.snapps.fetch(id).then(async (res) => {
			if (!res.created) throw error(404, { message: 'snapps:not:found' });

			const id = res[EntityId]!;
			res.ttl = Number(await db.redis.ttl('snapps:' + id));

			res.status = 'active';

			if (res.max_usages && res.used && Number(res.max_usages) <= Number(res.used))
				res.status = 'disabled';
			if (await db.blacklisted({ domain: extractDomain(res.original_url as string)! }))
				res.status = 'blacklisted';

			return res as DBSnapp as DBSnappEnriched;
		});

		const form = await request.formData();

		let original_url = form.get('original_url')?.toString().trim();
		let shortcode = form.get('shortcode')?.toString().trim();

		if (original_url) editSnapp.original_url = original_url;
		if (shortcode) editSnapp.shortcode = shortcode;

		let secret = form.get('secret')?.toString().trim();

		let max_usages = form.get('max_usages')?.toString().trim();
		const _expires = form.get('ttl')?.toString().trim();

		let notes = form.get('notes')?.toString().trim().replaceAll('  ', ' ');
		let usages: number | undefined;
		if (max_usages && typeof max_usages === 'string' && isNaN(Number(max_usages)) === false)
			usages = Number(max_usages);

		let expiration: number | undefined = await db.redis.ttl('snapps:' + editSnapp.id);

		if (_expires) expiration = _expires === '-1' ? undefined : Math.ceil(Number(_expires) / 1000);
		if (secret)
			editSnapp.secret = await bcrypt
				.genSalt(10)
				.then((salt) => bcrypt.hash(secret as string, salt))
				.then((hash) => hash);
		if (notes) editSnapp.notes = notes;
		if (usages) editSnapp.max_usages = usages;

		const result = await db.edit(editSnapp, fetch, expiration);

		if (result.status !== 200) {
			const {
				status,
				data: { message }
			} = result as SnappError;

			return fail(status as NumericRange<400, 599>, { message });
		} else return JSON.parse(JSON.stringify({ ...result, message: 'snapps:created' }));
	}
};
