import { error, redirect } from '@sveltejs/kit';
import { dev } from '$app/environment';
import { getBetterAuth } from '$lib/auth/server';
import { m } from '$lib/paraglide/messages';
import { settings } from '$lib/server/settings/index.js';

export const load = async ({ params: { id }, request, url }) => {
	const config = settings.get();
	let origin = url.origin;
	if (dev) origin = origin.replace('http:', 'https:');
	const host = config.hosts.find((h) => h.origin === origin);
	if (!host) throw error(400, { message: m.errors_unrecognized_host() });
	const auth = await getBetterAuth(host);
	try {
		await auth.api.acceptInvitation({
			body: {
				invitationId: id
			},
			headers: request.headers
		});
	} catch (err) {
		console.error(err);
		throw error(400, { message: m.errors_generic() });
	}

	redirect(307, '/dashboard');
};
