import { db } from '$lib/db/index.js';
import { extractDomain } from '$lib/db/snapps/shorten.js';
import jsonify from '$lib/utils/jsonify/index.js';
import { CalendarDate, getLocalTimeZone, today } from '@internationalized/date';
import { error, fail, redirect } from '@sveltejs/kit';

export async function load({ locals, params: { shortcode }, url, depends }) {
	depends('snapp:usages');
	const session = await locals.getSession();
	if (!session) throw redirect(302, '/auth/sign-in');

	const snapp = await db.snapps.search().where('shortcode').equals(shortcode).first();

	if (!snapp) throw error(404, { message: 'snapps:not:found' });

	const user = (await db.users
		.search()
		.where('id')
		.equalTo(session.user.id)
		.first()) as DBUser | null;
	if (!user) throw redirect(302, '/');

	if (snapp.user_id !== user.id && user.roles.includes('admin') === false)
		throw error(401, { message: 'auth:not:authorized' });
	const _end = url.searchParams.get('end')?.toString();
	const _start = url.searchParams.get('start')?.toString();

	let endingDate = _end !== undefined ? new Date(_end) : new Date(Date.now());
	endingDate.setHours(23, 59, 59, 999);

	const oneWeekAgo = new Date(endingDate);
	oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

	let startingDate = _start !== undefined ? new Date(_start) : oneWeekAgo;
	startingDate.setHours(0, 0, 0, 0);
	const url_usages = await db.usages
		.search()
		.where('snapp_id')
		.equals(snapp.id as string)
		.and('timestamp')
		.lte(new Date(endingDate.toString()))
		.and('timestamp')
		.gte(new Date(startingDate.toString()))
		.returnAll();

	delete snapp.secret;
	const id = snapp.id;
	snapp.ttl = Number(await db.redis.ttl('snapps:' + id));

	snapp.status = 'active';

	if (
		(snapp.max_usages && snapp.used && Number(snapp.max_usages) <= Number(snapp.used)) ||
		snapp.disabled === true
	)
		snapp.status = 'disabled';
	if (await db.blacklisted({ domain: extractDomain(snapp.original_url as string)! }))
		snapp.status = 'blacklisted';
	snapp.used = snapp.used ?? 0;

	return {
		startingDate: startingDate.toISOString(),
		endingDate: endingDate.toISOString(),
		shortcode,
		url: jsonify(snapp) as DBSnappEnriched,
		usages: jsonify(url_usages) as DBUsages[]
	};
}

export const actions = {
	async enableSnapp({ request, locals, params: { shortcode }, fetch }) {
		const session = await locals.getSession();
		if (!session) throw redirect(302, '/auth/sign-in');
		const form = await request.formData();
		let disabled = form.get('disabled')?.toString();

		if (!disabled || disabled.trim() === '') return fail(400, { message: 'global:system:error' });

		const snapp = (await db.snapps.search().where('shortcode').equals(shortcode).first()) as
			| DBSnapp
			| undefined;

		if (!snapp) return fail(404, { message: 'snapps:not:found' });

		snapp.disabled = disabled === 'true' ? true : false;

		await db.snapps.save(snapp.id, snapp);

		return {
			status: 200,
			success: true,
			message: disabled === 'true' ? 'snapp:has:been:disabled' : 'snapp:has:been:enabled'
		};
	}
};
