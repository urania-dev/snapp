import { database } from '$lib/server/db/database';
import { OIDCConfigs } from '$lib/server/oauth/config';
import { fail, redirect } from '@sveltejs/kit';

export function load({ locals: { session } }) {
	if (session) redirect(302, '/');

	const oidcProviders = OIDCConfigs.map((o) => ({ identity: o.identity }));

	return {
		oidcProviders
	};
}

export const actions = {
	default: async ({ request, cookies, url }) => {
		const form = await request.formData();

		const username = form.get('username')?.toString();
		const password = form.get('password')?.toString();
		if (!username || typeof username !== 'string' || !username.trim().length)
			return fail(400, { message: 'errors.auth.username-invalid' });
		if (!password || typeof password !== 'string')
			return fail(400, { message: 'errors.auth.wrong-credentials' });

		const is_username_allowed = await database.watchlist.check(null, username);
		if (!is_username_allowed) return fail(400, { message: 'errors.blacklisted.user' });

		const [user, err] = await database.users.authenticate(cookies, username, password);

		let message = null;
		if (err && err === 'PASSWORD_IS_INVALID') message = 'errors.auth.wrong-credentials';
		if (err && err === 'USER_DOES_NOT_EXISTS') message = 'errors.auth.user-not-found';
		if (message) return fail(500, { message });

		redirect(302, '/');
	}
};
