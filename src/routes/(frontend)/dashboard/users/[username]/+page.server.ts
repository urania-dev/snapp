import { env } from '$env/dynamic/public';
import getLanguage from '$lib/api/utils/getLanguage.js';
import getUrlParams from '$lib/api/utils/getUrlParams';
import { db } from '$lib/db';
import { extractDomain } from '$lib/db/snapps/shorten.js';
import { error, redirect } from '@sveltejs/kit';
import { randomUUID } from 'crypto';
import { EntityId } from 'redis-om';

export async function load({ locals, url, params: { username } }) {
	const session = await locals.getSession();
	if (!session) throw redirect(302, '/auth/sign-in');
	const is_admin = await db.admin(session.user.id);
	if (!is_admin) throw error(401, { message: 'auth:not:authorized' });
	let { page, limit, search, sort, sortDir, offset } = getUrlParams(url);
	const user = await db.users.search().where('username').equal(username).first();
	if (!user) throw error(404, { message: 'auth:user:not:found' });

	let query = db.snapps
		.search()
		.where('user_id')
		.equals(user.id as string);

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

					return url as DBSnapp as DBSnappEnriched;
				})
			)
	);

	return {
		username,
		count,
		page,
		limit,
		sort,
		active_columns: _columns?.split(',') ?? ['shortcode', 'created', 'used', 'status'],
		sortDirection: sortDir,
		urls: (JSON.parse(JSON.stringify(urls)) as DBSnappEnriched[]) ?? []
	};
}

export const actions = {
	async resendInvitation({ fetch, locals, params: { username }, url }) {
		const session = await locals.getSession();
		if (!session) throw redirect(302, '/auth/sign-in');
		const is_admin = await db.admin(session.user.id);
		if (!is_admin) throw error(401, { message: 'auth:not:authorized' });

		const { active_smtp } = await (await fetch('/api/smtp/test')).json();
		const user = (await db.users.search().where('username').equalTo(username).first()) as DBUser;

		if (active_smtp) {
			const token_id = randomUUID();

			const token = await db.apikeys.save(token_id, {
				id: token_id,
				created: new Date(),
				roles: ['admin'],
				user_id: user.id as string
			});

			await db.redis.expire('apikey:' + token_id, 60);

			const EN = await getLanguage();
			const APP_NAME = EN['global:appname'];
			const EMAIL_OBJECT = EN['emails:invited:object'].replace('{app_name}', APP_NAME);
			const EMAIL_DESCRIPTION = EN['emails:invited:text']
				.replace('{url}', `${env.PUBLIC_URL}/auth/recover-password?token=${token.id}`)
				.replace('{username}', user.username);
			const EMAIL_FOOTER = EN['emails:invited:footer'].replace('{url}', url.origin);

			const OUT_TEXT = EN['emails:global:out:text']
				.replace('{url}', url.origin)
				.replace('{app_name}', APP_NAME);

			const emailForm = new FormData();

			emailForm.set('to', user.email!);
			emailForm.set('app_name', APP_NAME);
			emailForm.set('email_object', EMAIL_OBJECT);
			emailForm.set('email_description', EMAIL_DESCRIPTION);
			emailForm.set('email_footer', EMAIL_FOOTER);
			emailForm.set('outer_text', OUT_TEXT);

			const send_mail = await fetch('/api/smtp/send', {
				headers: {
					authorization: 'Bearer ' + token.id
				},
				method: 'post',
				body: emailForm
			});
		}

		return { success: 200, message: 'users:invite:resent' };
	},
	async deleteIds({ request, locals }) {
		const session = await locals.getSession();
		if (!session) throw redirect(302, '/auth/sign-in');
		const is_admin = await db.admin(session.user.id);
		if (!is_admin) throw error(401, { message: 'auth:not:authorized' });

		const form = await request.formData();
		let _ids = form.get('ids')?.toString();
		let ids = _ids?.split(',') ?? [];

		await db.snapps.remove(...ids);

		return {
			success: 200,
			message: 'snapps:selected:removed'
		};
	},
	async saveColumns({ request, locals }) {
		const session = await locals.getSession();
		if (!session) throw redirect(302, '/auth/sign-in');

		const form = await request.formData();
		let columns = form.get('columns')?.toString();

		if (!session) throw redirect(302, '/auth/sign-in');
		if (columns) await db.setSetting('snapps:columns', columns, 'settings:' + session.user.id);

		return { success: true, message: 'settings:app:private:saved' };
	},
	async saveRowsCount({ request, locals }) {
		const session = await locals.getSession();
		if (!session) throw redirect(302, '/auth/sign-in');

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
