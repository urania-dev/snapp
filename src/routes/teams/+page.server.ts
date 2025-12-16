import type { TPermissions } from '$lib/schemas/host.schema';

import { redirect } from '@sveltejs/kit';
import { getBetterAuth } from '$lib/auth/server';
import { EnforcedPaginationSchema } from '$lib/schemas/pagination.schema.js';
import { db } from '$lib/server/db';
import { slugify } from '$lib/utils.js';
import * as v from 'valibot';
export const load = async ({ depends, locals: { user }, parent, request, url }) => {
	depends('teams:load');
	if (!user) redirect(307, '/auth/sign-in');
	const pagination = v.parse(EnforcedPaginationSchema, {
		...Object.fromEntries(url.searchParams.entries()),
		table: 'team'
	});
	const data = await parent();
	const auth = await getBetterAuth(data.host);
	const organizationId = slugify(data.host.origin);
	const teams = await auth.api.listOrganizationTeams({
		headers: request.headers,
		query: {
			organizationId
		}
	});

	const roles = await db.query.organizationRole.findMany({
		orderBy: { role: 'desc' },
		where: { organizationId }
	});
	const permissions = Object.fromEntries(
		roles.map((r) => [r.role, JSON.parse(r.permission)])
	) as Record<string, TPermissions>;

	return {
		...data,
		columnVisibility: pagination.columns,
		limit: pagination.limit,
		organizationId,
		permissions,
		roles,
		teams
	};
};
