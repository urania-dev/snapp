import { error } from '@sveltejs/kit';
import { dev } from '$app/environment';
import { getRequestEvent } from '$app/server';
import { getBetterAuth } from '$lib/auth/server';
import { m } from '$lib/paraglide/messages';
import { slugify } from '$lib/utils';

import { settings } from '../settings';

export const authenticateAPI = async () => {
	const { request, url: u } = getRequestEvent();
	const config = settings.get();
	let origin = u.origin;
	if (dev) origin = origin.replace('http:', 'https:');
	const host = config.hosts.find((h) => h.origin === origin);
	if (!host) error(403, { message: m.errors_unrecognized_host() });
	const auth = await getBetterAuth(host);
	const key = request.headers.get('authorization')?.split('Bearer ')?.[1] || 'x-api-key';
	const hostId = slugify(host.origin);

	const authenticated = await auth.api.verifyApiKey({
		body: {
			key,
			permissions: {
				[hostId]: ['read']
			}
		}
	});

	if (authenticated.key === null)
		throw error(401, {
			message:
				authenticated.error?.code === 'RATE_LIMITED' ? m.rate_limited() : m.errors_unauthorized()
		});
	return {host,key:authenticated.key, organizationId:hostId,};
};
