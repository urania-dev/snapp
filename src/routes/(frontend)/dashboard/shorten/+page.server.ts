import { db } from '$lib/db/index.js';
import type SnappError from '$lib/db/utils/snappError.js';
import { fail, redirect, type NumericRange } from '@sveltejs/kit';
import { randomUUID } from 'crypto';
import type { Actions } from './$types';

export async function load({ locals, parent }) {
	const session = await locals.getSession();

	if (!session) throw redirect(302, '/auth/sign-in');
	const data = await parent();
	const user = (await db.users.search().where('id').equal(session.user.id).first()) as DBUser;

	const isAdmin = await db.admin(session.user.id);

	return {
		max_urls: user.settings?.max?.urls ?? data.max_urls ?? 0,
		existing: await db.snapps.search().where('user_id').equal(session.user.id).returnCount(),
		isAdmin: (typeof isAdmin === 'boolean' && isAdmin) || false
	};
}

export const actions: Actions = {
	async shorten({ request, locals, fetch }) {
		const session = await locals.getSession();
		if (!session) throw redirect(302, '/auth/sign-in');

		const form = await request.formData();

		let original_url = form.get('original_url')?.toString().trim();
		let shortcode = form.get('shortcode')?.toString().trim();

		let secret = form.get('secret')?.toString().trim();

		let max_usages = form.get('max_usages')?.toString().trim();
		const _expires = form.get('ttl')?.toString().trim();

		let notes = form.get('notes')?.toString().trim().replaceAll('  ', ' ');
		let usages: number | undefined;
		if (max_usages && typeof max_usages === 'string' && isNaN(Number(max_usages)) === false)
			usages = Number(max_usages);

		let expiration: number | undefined;

		if (_expires) expiration = _expires === '-1' ? -1 : Math.ceil(Number(_expires) / 1000);
		
		let newSnapp: Partial<DBSnapp> = {
			id: randomUUID(),
			original_url,
			shortcode,
			secret,
			max_usages: usages,
			notes,
			user_id: session.user.id
		};
		
		const result = await db.shorten(newSnapp, fetch, expiration);

		if (result.status !== 200) {
			const {
				status,
				data: { message }
			} = result as SnappError;

			return fail(status as NumericRange<400, 599>, { message });
		} else return JSON.parse(JSON.stringify({ ...result, message: 'snapps:created' }));
	}
};
