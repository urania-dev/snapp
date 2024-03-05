import getUrlParams from '$lib/api/utils/getUrlParams';
import { db } from '$lib/db';
import { extractDomain } from '$lib/db/snapps/shorten.js';
import { fail, redirect } from '@sveltejs/kit';
import { existsSync } from 'fs';
import { EntityId } from 'redis-om';

export async function load({ locals, url }) {
	const session = await locals.getSession();
	if (!session) throw redirect(302, '/auth/sign-in');
	let { page, limit, search, sort, sortDir, offset } = getUrlParams(url);
	let query = db.snapps.search().where('user_id').equals(session.user.id);
	const filepath = process.cwd() + '/prisma/db.sqlite';
	const oldDB = existsSync(filepath);

	if (sort && sortDir === 'asc') query.sortAsc(sort);
	if (sort && sortDir === 'desc') query.sortDesc(sort);

	if (search && search !== '')
		query.where('shortcode').does.equal(`*${search}*`).or('original_url').equal(`*${search}*`);

	const count = await query.returnCount();

	let _limit = await db.getSetting('row:count', 'settings:' + session.user.id);
	let _columns = await db.getSetting('snapps:columns', 'settings:' + session.user.id);

	if (_limit) limit = Number(_limit);
	if (_limit) offset = Number(+(+page - 1) * +limit);
	const urls = await query.return.page(offset, limit).then(
		async (urls) =>
			await Promise.all(
				urls.map(async (url) => {
					delete url.secret;
					const id = url[EntityId]!;
					url.ttl = Number(await db.redis.ttl('snapps:' + id));

					url.status = 'active';

					if (url.max_usages && url.used && Number(url.max_usages) <= Number(url.used))
						url.status = 'disabled';
					if (await db.blacklisted({ domain: extractDomain(url.original_url as string)! }))
						url.status = 'blacklisted';
					url.used = url.used ?? 0;
					if (url.disabled === true) url.status = 'disabled';

					return url as DBSnapp as DBSnappEnriched;
				})
			)
	);

	return {
		count,
		page,
		limit,
		sort,
		has_sqlite: oldDB,
		active_columns: _columns?.split(',') ?? ['shortcode', 'created', 'used', 'status'],
		sortDirection: sortDir,
		urls: (JSON.parse(JSON.stringify(urls)) as DBSnappEnriched[]) ?? []
	};
}

export const actions = {
	async deleteIds({ request, locals }) {
		const session = await locals.getSession();
		if (!session) throw redirect(302, '/auth/sign-in');

		const form = await request.formData();
		let _ids = form.get('ids')?.toString();
		let ids = _ids?.split(',') ?? [];

		const is_admin = await db.admin(session.user.id);
		if (!is_admin)
			await Promise.all(
				ids.map(async (id) => {
					const author = await db.authorship({ id, user_id: session.user.id });

					if (author.status === 200 && author.is_author === true) {
						// pass
					} else {
						return fail(401, { message: 'auth:not:authorized' });
					}
				})
			);

		await db.snapps.remove(...ids);

		return {
			success: 200,
			message: 'snapps:selected:removed'
		};
	},
	async saveColumns({ request, locals }) {
		const session = await locals.getSession();

		const form = await request.formData();
		let columns = form.get('columns')?.toString();

		if (!session) throw redirect(302, '/auth/sign-in');
		if (columns) await db.setSetting('snapps:columns', columns, 'settings:' + session.user.id);

		return { success: true, message: 'settings:app:private:saved' };
	},
	async saveRowsCount({ request, locals }) {
		const session = await locals.getSession();

		const form = await request.formData();
		let _limit = form.get('limit')?.toString();

		if (!session) throw redirect(302, '/auth/sign-in');
		else {
			if (_limit && Number(_limit) < 10000)
				await db.setSetting('row:count', _limit, 'settings:' + session.user.id);

			return { success: true, limit: _limit, message: 'settings:app:private:saved' };
		}
	}
};
