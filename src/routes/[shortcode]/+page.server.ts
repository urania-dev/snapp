import { database } from '$lib/server/db/database.js';
import { markUsage } from '$lib/server/mark-usage/index.js';
import { error, fail, redirect } from '@sveltejs/kit';
import { verify } from '@node-rs/argon2';
import { SNAPP_DISABLED } from '$lib/utils/constants.js';

export const load = async ({
	locals: { user },
	fetch,
	parent,
	url,
	request,
	params: { shortcode }
}) => {
	if (!shortcode) error(404, { message: 'errors.snapps.not-found' });

	const [redirection, err] = await database.snapps.one(shortcode);

	if (!redirection) throw error(404, { message: 'errors.snapps.not-found' });
	if (redirection.disabled === true) throw error(404, { message: 'errors.snapps.disabled' });
	if (redirection !== null) {
		const is_allowed = await database.snapps.validate(redirection.original_url, fetch);

		if (!is_allowed)
			throw error(401, {
				message: 'errors.blacklisted.snapp'
			});

		const { secret } = redirection;
		const data = await parent();
		if (secret === null) {
			if (user === null || (user && user.id !== redirection.userId))
				await markUsage(redirection, request, url, fetch);
			throw redirect(302, encodeURIComponent(redirection.original_url));
		} else return { ...data, shortcode, has_secret: true };
	} else error(404, { message: 'errors.snapps.not-found' });
};

export const actions = {
	async default({ locals: { user, session }, request, params: { shortcode }, fetch, url }) {
		const form = await request.formData();
		const secret = form.get('secret') as string | null;
		if (secret) {
			const [snapp, err] = await database.snapps.one(shortcode);
			if (err === SNAPP_DISABLED) return fail(400, { message: 'errors.snapps.disabled' });
			if (snapp === null || !snapp.secret)
				return fail(404, {
					message: 'errors.snapps.not-found',
					short_code: null,
					success: false
				});

			const validPassword = await verify(snapp.secret, secret, {
				memoryCost: 19456,
				timeCost: 2,
				outputLen: 32,
				parallelism: 1
			});

			if (validPassword) {
				if (!user || user.id !== snapp.userId) await markUsage(snapp, request, url, fetch);
				return { url: snapp.original_url };
			} else
				return fail(401, {
					message: 'errors.snapps.wrong-credentials',
					short_code: null,
					success: false
				});

		} else
			return fail(400, {
				message: 'errors.snapps.missing-secret',
				short_code: null,
				success: false
			});
	}
};
