
import { error, redirect } from '@sveltejs/kit';
import { m } from '$lib/paraglide/messages.js';
import { hasPermission } from '$lib/remotes/auth.remote.js';
import { CONSTANTS } from '$lib/server/const.js';
import { db } from '$lib/server/db/index.js';
import { metric } from '$lib/server/db/schema.js';
import { fillMissingDays } from '$lib/utils.js';
import { and, eq, gte, lte, sql } from 'drizzle-orm';
import * as v from 'valibot';

export const load = async ({ locals: { user }, params: { id }, url }) => {
	if (!user) redirect(307, '/auth/sign-in');

	const short = await db.query.url.findFirst({
		where: {
			id,
		},
		with: { tags: true, teams: true }
	});

	if (!short) redirect(307, '/urls');

		let checkTeam = true;

		if (short.teams.length > 0) {
			const permissions = user.role === 'admin' ? [true] : await Promise.all(
				short.teams.map(async (team) => {
					try {
						return await hasPermission({
							context: team.id,
							organizationId:team.organizationId,
							permissions: ['read']
						});
					} catch (e) {
						if (CONSTANTS.DEBUG) console.error(e);
						return false;
					}
				})
			);
			checkTeam = permissions.some((p) => p === true);
			if (!checkTeam) throw error(403, { message: m.errors_unauthorized() });
		}

	const endDate = new Date();
	endDate.setHours(23, 59, 59, 99);

	const startDate = new Date(endDate);
	startDate.setDate(endDate.getDate() - 7);
	const ParamsSchema = v.object({
		from: v.pipe(
			v.optional(v.string(), startDate.toISOString()),
			v.transform((i) => new Date(i))
		),
		to: v.pipe(
			v.optional(v.string(), endDate.toISOString()),
			v.transform((i) => new Date(i))
		)
	});

	const { from, to } = v.parse(ParamsSchema, Object.fromEntries(url.searchParams.entries()));

	const rawStats = await db
		.select({
			day: sql`DATE(${metric.timestamp})`
				.mapWith((d) => new Date(d))
				.as('day'),
			externalVisits: sql<number>`
        SUM(
          CASE 
            WHEN ${metric.organizationId} <> ${short.organizationId} THEN 1 
            ELSE 0 
          END
        )
      `
				.mapWith(Number)
				.as('externalVisits'),
			internalVisits: sql<number>`
        SUM(
          CASE 
            WHEN ${metric.organizationId} = ${short.organizationId} THEN 1 
            ELSE 0 
          END
        )
      `
				.mapWith(Number)
				.as('internalVisits')
		})
		.from(metric)
		.where(
			and(
				eq(metric.urlId, short.id),
				gte(metric.timestamp, from),
				lte(metric.timestamp, to)
			)
		)
		.groupBy(sql`DATE(${metric.timestamp})`)
		.orderBy(sql`DATE(${metric.timestamp})`);

	const internalSeries = fillMissingDays(
		from,
		to,
		rawStats.map((row) => ({
			day: row.day,
			visits: row.internalVisits
		}))
	);

	const externalSeries = fillMissingDays(
		from,
		to,
		rawStats.map((row) => ({
			day: row.day,
			visits: row.externalVisits
		}))
	);
	return {
		from,
		stats: {
			external: externalSeries,
			internal: internalSeries
		},
		to,
		url: { ...short, secret: short.secret !== null }
	};
};
