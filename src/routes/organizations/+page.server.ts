import type { TPermissions } from '$lib/schemas/host.schema';

import { redirect } from '@sveltejs/kit';
import { getBetterAuth } from '$lib/auth/server';
import { getHost } from '$lib/remotes/config.remote.js';
import { EnforcedPaginationSchema } from '$lib/schemas/pagination.schema';
import { db } from '$lib/server/db/index.js';
import { teamMember } from '$lib/server/db/schema.js';
import { settings } from '$lib/server/settings/index.js';
import { slugify } from '$lib/utils.js';
import { count, eq } from 'drizzle-orm';
import * as v from 'valibot';
import yaml from 'yaml';

export const load = async ({ depends, locals: { user }, request, url }) => {
	depends('organization:load');
	if (!user) redirect(307, '/auth/sign-in');
	if (user.role === 'user') redirect(307, '/auth/dashboard');

	const pagination = v.parse(EnforcedPaginationSchema, {
		...Object.fromEntries(url.searchParams.entries()),
		table: 'organization'
	});
	const host = await getHost()
	const auth = await getBetterAuth(host);
	
	const _organizations = await auth.api.listOrganizations({
		headers: request.headers
	});
	
	
	const config = settings.get();
	const rawConfigs = config.hosts.map((h) => ({ host: slugify(h.origin), raw: yaml.stringify(h) }));

	return {
		columnVisibility: pagination.columns,
		limit: pagination.limit,
		organizations: await Promise.all(
			_organizations.map(async (o) => {
				const members = await auth.api.listMembers({
					headers: request.headers,
					query: { organizationId: o.id }
				});
				const teams = await auth.api.listOrganizationTeams({
					headers: request.headers,
					query: { organizationId: o.id }
				});

				const roles = await db.query.organizationRole.findMany({
					orderBy: { role: 'desc' },
					where: { organizationId: o.id }
				});
				const permissions = Object.fromEntries(
					roles.map((r) => [r.role, JSON.parse(r.permission)])
				) as Record<string, TPermissions>;

				const teamWithMemberCount = await Promise.all(
					teams.map(async (t) => ({
						...t,
						memberCount: (
							await db
								.select({ count: count() })
								.from(teamMember)
								.where(eq(teamMember.teamId, t.id))
						)?.[0]?.count
					}))
				);
				const invitations = await auth.api.listInvitations({
					headers: request.headers,
					query: { organizationId: o.id }
				});

				const member = await db.query.member.findFirst({
					where: { organizationId: o.id, userId: user.id }
				});
				return {
					...o,
					invitations,
					member,
					members: members?.members || [],
					permissions,
					roles,
					teams: teamWithMemberCount
				};
			})
		),
		rawConfigs
	};
};
