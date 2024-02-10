import { db } from '$lib/db/index.js';
import type SnappError from '$lib/db/utils/snappError.js';
import { slugify } from '$lib/utils/slugify/index.js';
import { fail, redirect } from '@sveltejs/kit';

export async function load({ locals }) {
	const session = await locals.getSession();
	if (session) throw redirect(302, '/');
}

export const actions = {
	async default({ request, locals }) {
		const session = await locals.getSession();
		if (session) throw redirect(302, '/');
		const form = await request.formData();
		const username = form.get('username')?.toString()?.trim();
		const email = form.get('email')?.toString();
		const password = form.get('password')?.toString();
		const confirmPassword = form.get('confirm_password')?.toString();

		const auth = await db.signupUser({
			username: username ? slugify(username) : undefined,
			email,
			password,
			confirmPassword
		});
		
		if (auth.status !== 200) {
			const { status, data } = auth as SnappError;
			return fail(status, data);
		} else return auth;
	}
};
