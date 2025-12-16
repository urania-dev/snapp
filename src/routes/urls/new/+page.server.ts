import { redirect } from '@sveltejs/kit';
import { getBetterAuth } from '$lib/auth/server.js';
import { db } from '$lib/server/db/index.js';
import { tag, urlToTag } from '$lib/server/db/schema.js';
import { desc, sql } from 'drizzle-orm/sql';

export const load = async ({ locals: { user }, parent, request }) => {
	if (!user) redirect(307, '/auth/sign-in');

	const tags = await db
		.select({
			count: sql<number>`
    (SELECT COUNT(*) FROM ${urlToTag} WHERE ${urlToTag.tagId} = ${tag.id})
  `,
			id: tag.id,
			tag: tag.tag
		})
		.from(tag)
		.orderBy(desc(sql`count`));

	const data = await parent();
	const auth = await getBetterAuth(data.host);
	const teams = await auth.api.listOrganizationTeams({
		headers: request.headers,
		query: {
			organizationId: data.activeOrganization?.id
		}
	});

	return { tags, teams };
};
