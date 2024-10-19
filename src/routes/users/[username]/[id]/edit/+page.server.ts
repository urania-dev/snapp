import { database } from '$lib/server/db/database';
import {
	ALLOW_UNSECURE_HTTP,
	MAX_SNAPPS_PER_USER,
	SNAPP_ORIGIN_URL_BLACKLISTED,
	SNAPP_ORIGIN_URL_REQUESTED,
	UNAUTHORIZED
} from '$lib/utils/constants.js';
import { fail, redirect } from '@sveltejs/kit';

export const load = async ({
	locals: { session, user },
	request,
	params: { id, username },
	url
}) => {
	if (!session || !user) redirect(302, '/auth/sign-in');
	if (!id) redirect(302, '/dashboard');
	const is_admin = await database.users.is_admin(user.id);
	if (!is_admin) redirect(302, '/dashboard');
	const allow_http = database.settings.parse(
		await database.settings.get(ALLOW_UNSECURE_HTTP),
		true
	);

	const [snapp] = await database.snapps.id(id);

	if (!snapp) redirect(302, '/dashboard');
	return { allow_http, snapp, username };
};

export const actions = {
	default: async ({ locals: { session, user }, request, fetch }) => {
		if (!session || !user) redirect(302, '/');

		const form = await request.formData();
		const edit_snapp = form.get('snapp')?.toString();
		const is_admin = await database.users.is_admin(user.id);
		if (!is_admin) redirect(302, '/dashboard');
		if (!edit_snapp) return fail(400, { message: 'errors.snapps.original-url-missing' });
		const parsed = JSON.parse(edit_snapp) as Snapp & { tags: Tag[] }

		const [snapp, err] = await database.snapps.edit({ ...parsed, tags: parsed.tags.map(t => t.slug) }, session.userId, fetch);

		let message: string | undefined = undefined;
		if (err === MAX_SNAPPS_PER_USER) message = 'errors.snapps.max-snapps';
		if (err === SNAPP_ORIGIN_URL_REQUESTED) message = 'errors.snapps.original-url-missing';
		if (err === SNAPP_ORIGIN_URL_BLACKLISTED) message = 'errors.snapps.original-url-blacklisted';
		if (err === UNAUTHORIZED) message = 'errors.unauthorized';
		if (err === ALLOW_UNSECURE_HTTP) message = 'errors.snapps.unallowed-not-https';
		if (message) return fail(400, { message });
		else return { message: 'snapps.actions.edited', success: true };
	}
};
