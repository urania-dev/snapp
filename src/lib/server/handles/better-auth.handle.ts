import { error, type Handle, redirect } from '@sveltejs/kit';
import { building, dev } from '$app/environment';
import { getBetterAuth } from '$lib/auth/server';
import { m } from '$lib/paraglide/messages';
import { slugify } from '$lib/utils';
import { svelteKitHandler } from 'better-auth/svelte-kit';

import { CONSTANTS } from '../const';
import { db } from '../db';
import { settings } from '../settings';
const handle: Handle = async ({ event, resolve }) => {
	if(event.url.pathname === '/db-offline') return resolve(event)
	const config = settings.get();
	let origin = event.url.origin;
	if (dev) origin = origin.replace('http:', 'https:');
	const host = config.hosts.find((h) => h.origin === origin) || config.hosts[0];
	const auth = await getBetterAuth(host);
	const authentication = await auth.api.getSession({ headers: event.request.headers });
	if (authentication) {
		event.locals.session = authentication.session || null;
		event.locals.user = authentication.user || null;
		if (authentication && event.url.pathname === '/auth/sign-in') redirect(307, '/dashboard');
		try {
			if (!event.locals.session.activeOrganizationId) {
				await auth.api.setActiveOrganization({
					body: { organizationId: slugify(host.origin) },
					headers: event.request.headers
				});
			}
		} catch (err) {
			if (!event.url.pathname.startsWith('/auth')) {
				if (err as { body?: { code?: 'USER_IS_NOT_A_MEMBER_OF_THE_ORGANIZATION' } }) {
					const invitation = await db.query.invitation.findFirst({
						where: {
							email: authentication.user.email,
							expiresAt: { gt: new Date() },
							organizationId: slugify(host.origin),
							status: 'pending'
						}
					});
					if (invitation) {
						redirect(307, `/auth/invitation/${invitation.id}`);
					}
					throw error(403, { message: m.not_a_member() });
				}
				if (CONSTANTS.DEBUG) console.error('[auth error]', 'better-auth.handle.ts', err);
				throw error(401, { message: m.errors_unrecognized_host() });
			}
		}
	}
	event.url.protocol = dev && host.origin.startsWith('https') ? 'https:' : event.url.protocol;
	return svelteKitHandler({ auth, building, event, resolve });
};
export default handle;

export const handle2fa: Handle = ({ event, resolve }) => {
	if(event.url.pathname === '/db-offline') return resolve(event)
	const config = settings.get();
	let origin = event.url.origin;
	if (dev) origin = origin.replace('http:', 'https:');
	const host = config.hosts.find((h) => h.origin === origin) || config.hosts[0];
	if (
		host.options.disable.twoFactor !== true &&
		event.locals.user &&
		event.locals.user?.twoFactorEnabled === false &&
		!['/auth/2fa', '/auth/setup-2fa'].includes(event.url.pathname)
	)
		redirect(307, '/auth/setup-2fa');
	return resolve(event);
};
