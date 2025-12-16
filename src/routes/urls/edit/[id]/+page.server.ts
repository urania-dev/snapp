import { error, redirect } from '@sveltejs/kit';
import { getBetterAuth } from '$lib/auth/server.js';
import { errors_unauthorized } from '$lib/paraglide/messages.js';
import { hasPermission } from '$lib/remotes/auth.remote';
import { db } from '$lib/server/db/index.js';
import { tag, urlToTag } from '$lib/server/db/schema.js';
import { slugify } from '$lib/utils.js';
import { desc, sql } from 'drizzle-orm/sql';

export const load = async ({ locals: { user }, params: { id }, parent, request }) => {
	if (!user) redirect(307, '/auth/sign-in');

	const record = await db.query.url.findFirst({
		where: { id },
		with: { tags: true, teams: true }
	});
	if (!record) redirect(307, '/urls');

	let allowed = false;

	if (record.userId === user.id || user.role === 'admin') {
		allowed = true;
	} else {
		const teamIds = record.teams.map((t) => t.id);
		if (teamIds.length > 0) {
			const data = await parent();
			const organizationId = slugify(data.host.origin);

			const permissions = await Promise.all(
				teamIds.map(async (teamId) => {
					try {
						return await hasPermission({
							context: teamId,
							organizationId,
							permissions: ['update']
						});
					} catch {
						return false;
					}
				})
			);

			if (permissions.every(Boolean)) allowed = true;
		}
	}

	if (!allowed) throw error(401, { message: errors_unauthorized() });

	const tags = await db
		.select({
			count: sql<number>`(SELECT COUNT(*) FROM ${urlToTag} WHERE ${urlToTag.tagId} = ${tag.id})`,
			id: tag.id,
			tag: tag.tag
		})
		.from(tag)
		.orderBy(desc(sql`count`));

	const data = await parent();
	const auth = await getBetterAuth(data.host);
	const organizationId = slugify(data.host.origin);
	const teams = await auth.api.listOrganizationTeams({
		headers: request.headers,
		query: { organizationId }
	});

	return { tags, teams, url: record };
};
