import type { TPermissions } from '$lib/schemas/host.schema.js';

import { error, redirect } from '@sveltejs/kit';
import { dev } from '$app/environment';
import { getBetterAuth } from '$lib/auth/server.js';
import { m } from '$lib/paraglide/messages.js';
import { EnforcedPaginationSchema } from '$lib/schemas/pagination.schema';
import { CONSTANTS } from '$lib/server/const';
import { db } from '$lib/server/db/index.js';
import { tag, teamToUrl, urlToTag } from '$lib/server/db/schema';
import { settings } from '$lib/server/settings';
import { slugify } from '$lib/utils';
import { count, desc, eq, sql } from 'drizzle-orm';
import * as v from 'valibot';
export const load = async ({ depends, locals: { user }, params: { id }, request,url: u }) => {
	depends('users:load');
	if (!user) redirect(307, '/auth/sign-in');
	if (user.role === 'user') redirect(307, '/auth/dashboard');
	const config = settings.get();
	let origin = u.origin;
	if (dev) origin = origin.replace('http:', 'https:');
	const host = config.hosts.find((h) => h.origin === origin);
	if (!host) throw error(400, { message: m.errors_unrecognized_host() });
	const pagination = v.parse(EnforcedPaginationSchema, {
		...Object.fromEntries(u.searchParams.entries()),
		table: 'url'
	});
	const auth = await getBetterAuth(host)
	const team = await db.query.team.findFirst({
		where: { id },
		with: { teamMembers: { with: { user: true } } }
	});
	if (!team) redirect(307, '/teams');
	try {
		const member = await auth.api.getActiveMember({headers:request.headers})
		if(!member) redirect(307,'/dashboard')
		const tags = db
			.select({
				count: sql<number>`
		(SELECT COUNT(*) FROM ${urlToTag} WHERE ${urlToTag.tagId} = ${tag.id})
	  `,
				id: tag.id,
				tag: tag.tag
			})
			.from(tag)
			.orderBy(desc(sql`count`));

		const urlCount = db
			.select({ count: count() })
			.from(teamToUrl)
			.where(eq(teamToUrl.teamId, id))
			.limit(1);
		const hasPermission = await auth.api.hasPermission({body:{organizationId:slugify(host.origin), permissions:{[team.id]: ['read']}}, headers:request.headers})
		const urls = db.query.teamToUrl.findMany({
			limit: pagination.limit,
			offset: pagination.offset,
			where: {
				AND: [
					{ team: { organizationId: slugify(host.origin) }, teamId: id },

					pagination.query
						? {
								OR: [
									{ url: { notes: { ilike: `%${pagination.query}%` } } },
									{ url: { originalUrl: { ilike: `%${pagination.query}%` } } },
									{ url: { shortcode: { ilike: `%${pagination.query}%` } } }
								]
							}
						: undefined
				].filter((f) => !!f)
			},
			with: {
				url: {
					orderBy: pagination.sort
						? {
								[pagination.sort]: pagination.desc ? 'desc' : 'asc'
							}
						: undefined,
					with: {
						tags: true
					}
				}
			}
		})
		const roles = await db.query.organizationRole
			.findMany({ orderBy:{role:'desc'}, where: { organizationId: slugify(host.origin) } })

		const permissions = Object.fromEntries(roles.map(r=>([r.role,JSON.parse(r.permission)]))) as Record<string,TPermissions>
		
		return {
			columnVisibility: pagination.columns,
			limit: pagination.limit,
			permissions,
			roles,
			tags: await tags,
			team: team,
			teamUrls: hasPermission.success ? await urls.then((urls) =>
				urls.map((u) => ({
					...u,
					url: { ...u.url!, secret: u.url?.secret !== null ? true : false }
				}))
			): [],
			urlCount: await urlCount.then(([c]) => c.count || 0),
			user: {...user, member},
		};
	} catch (error) {
		if (CONSTANTS.DEBUG) console.error(error);
		redirect(307, '/users');
	}
};
