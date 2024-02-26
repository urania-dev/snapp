import { db } from '$lib/db/index.js';
import type SnappError from '$lib/db/utils/snappError.js';
import { redirect, fail } from '@sveltejs/kit';

export async function load({ locals, fetch }) {
	const { active_smtp } = await (await fetch('/api/smtp/test')).json();

	return { active_smtp };
}

export const actions = {
	async default({ locals, request }) {
		const session = await locals.getSession();
		if (session) throw redirect(302, '/');
		const form = await request.formData();
		const username = form.get('username')?.toString();
		const password = form.get('password')?.toString();

		const auth = await db.signinUser(username, password);
		if (auth.status !== 200) {
			const { status, data } = auth as SnappError;

			return fail(status, data);
		} else return auth;
	}
};
