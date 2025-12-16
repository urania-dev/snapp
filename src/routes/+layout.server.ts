import { error } from '@sveltejs/kit';
import { dev } from '$app/environment';
import { m } from '$lib/paraglide/messages';
import { db } from '$lib/server/db';
import { settings } from '$lib/server/settings';
import { slugify } from '$lib/utils.js';
export const load = async ({ depends, locals: { session, user }, url }) => {
	depends('auth:user');
	const isDBError = url.pathname === '/db-offline'
	const config = settings.get();
	let origin = url.origin;
	if (dev) origin = origin.replace('http:', 'https:');
	const host = config.hosts.find((h) => h.origin === origin);
	if (!host) error(400, { message: m.errors_unrecognized_host() });
	
	
	const invitations = user && !isDBError
		? await db.query.invitation.findMany({
				where: {
					email: user.email,
					status: 'pending'
				},
				with: {
					organization: true,
					user: true
				}
			})
		: [];

	const notifications = {
		invitations: invitations.map((i) => ({ ...i, organization: i.organization!, user: i.user! })),
		lastLogin: session?.updatedAt
	};
	return {
		activeOrganization:!isDBError && await db.query.organization.findFirst({
		where: { id: slugify(host.origin) }
	}) || null,
		appname:config.appname,
		host,
		notifications,
		user
	};
};
