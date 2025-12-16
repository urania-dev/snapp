import { redirect } from '@sveltejs/kit';
import { EnforcedPaginationSchema } from '$lib/schemas/pagination.schema.js';
import { db } from '$lib/server/db/index.js';
import { tag, url, urlToTag } from '$lib/server/db/schema.js';
import { slugify } from '$lib/utils.js';
import { and, count, desc, eq, sql } from 'drizzle-orm';
import * as v from 'valibot';

export const load = async ({ depends, locals: { user }, parent, url: u }) => {
	depends('users:load');
	if (!user) redirect(307, '/auth/sign-in');
	
	const pagination = v.parse(EnforcedPaginationSchema, {
		...Object.fromEntries(u.searchParams.entries()),
		table: 'url'
	});

	const data = await parent();
	const organizationId = slugify(data.host.origin);

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

	const urls = db.query.url.findMany({
		limit: pagination.limit,
		offset: pagination.offset,
		orderBy: pagination.sort
			? {
					[pagination.sort]: pagination.desc ? 'desc' : 'asc'
				}
			: undefined,
		where: {
			AND: [
				
				{organizationId, userId:user.id},
				pagination.tags && pagination.tags?.length > 0
					? {
							tags: {
								tag: {
									in: pagination.tags
								}
							}
						}
					: undefined,
				pagination.query
					? {
							OR: [
								{ notes: { ilike: `%${pagination.query}%` } },
								{ originalUrl: { ilike: `%${pagination.query}%` } },
							]
						}
					: undefined
			].filter((f) => !!f)
		},
		with: {
			tags: true
		}
	});

	return {
		...data,
		columnVisibility: pagination.columns,
		count: await db
			.select({ count: count() })
			.from(url)
			.where(and(eq(url.userId, user.id), eq(url.organizationId, organizationId)))
			.then(([{ count }]) => count),
		limit: pagination.limit,
		organizationId,
		tags: await tags,
		urls: await urls.then((list) => list.map((u) => ({ ...u, secret: u.secret !== null })))
	};
};
