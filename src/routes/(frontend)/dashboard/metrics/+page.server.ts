import { db } from '$lib/db/index.js';
import { extractDomain } from '$lib/db/snapps/shorten.js';
import jsonify from '$lib/utils/jsonify/index.js';
import { redirect } from '@sveltejs/kit';

export async function load({ locals, params, url, depends }) {
	depends('snapp:usages');
	const session = await locals.getSession();
	if (!session) throw redirect(302, '/auth/sign-in');

	const _end = url.searchParams.get('end')?.toString();
	const _start = url.searchParams.get('start')?.toString();

	let endingDate = _end !== undefined ? new Date(_end) : new Date(Date.now());
	endingDate.setHours(23, 59, 59, 999);

	const oneWeekAgo = new Date(endingDate);
	oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

	let startingDate = _start !== undefined ? new Date(_start) : oneWeekAgo;
	startingDate.setHours(0, 0, 0, 0);
	const isAdmin = await db.admin(session.user.id);

	const query = db.usages.search();
	const query_url = db.snapps.search();

	query
		.where('timestamp')
		.lte(new Date(endingDate.toString()))
		.and('timestamp')
		.gte(new Date(startingDate.toString()));

	if (!isAdmin) query.and('snapp_user_id').equal(session.user.id);
	if (!isAdmin) query_url.where('user_id').equal(session.user.id);

	query_url.sortBy('used', 'DESC');

	let expired: string[] = [];
	const url_usages = await Promise.all(
		((await query.returnAll()) as DBUsages[]).map(async (url) => {
			const snapp = await db.snapps.fetch(url.snapp_id);
			let shortcode = snapp.shortcode;
			if (!shortcode) shortcode = '-- expired - ' + expired.length + ' --';
			if (!expired.includes(url.snapp_id)) expired.push(url.snapp_id);
			return { ...url, shortcode };
		})
	);

	return {
		startingDate: startingDate,
		endingDate: endingDate,
		saved_position: await db.getSetting('world:map:position', `settings:${session.user.id}`),
		usages: jsonify(url_usages) as (DBUsages & { shortcode: string })[]
	};
}

export const actions = {
	async saveMapPosition({ request, locals }) {
		const session = await locals.getSession();
		if (!session) throw redirect(302, '/auth/sign-in');

		const form = await request.formData();
		const position = form.get('position')?.toString();
		if (position)
			await db.setSetting('world:map:position', position, `settings:${session.user.id}`);
		return {
			status: 200,
			message: 'settings:app:private:saved'
		};
	},
	async removeExpired({ locals, request }) {
		const session = await locals.getSession();
		if (!session) throw redirect(302, '/auth/sign-in');

		const ids = (await db.usages.search().returnAll()) as DBUsages[];

		let to_delete: string[] = [];
		await Promise.all(
			ids.map(async ({ snapp_id,id }: DBUsages) => {
				const snapp = await db.snapps.search().where('id').equalTo(snapp_id).first();
				if (!snapp) to_delete.push(id);
			})
		);

		await db.usages.remove(...to_delete);

		return {
			status: 200,
			message: 'graphs:expired:deleted'
		};
	}
};
