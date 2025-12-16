import { error, json } from '@sveltejs/kit';
import { defineEndpoint } from '@uraniadev/sveltekit-valibot-openapi';
import { errors_unauthorized, m } from '$lib/paraglide/messages';
import { hasPermission } from '$lib/remotes/auth.remote.js';
import { UrlMetricsQuerySchema, UrlMetricsResponseSchema } from '$lib/schemas/metrics.schema';
import { authenticateAPI } from '$lib/server/api/authenticate.js';
import { CONSTANTS } from '$lib/server/const.js';
import { db } from '$lib/server/db';
import { metric } from '$lib/server/db/schema.js';
import { getOrganizationDashboardMetrics } from '$lib/server/metrics/helpers.js';
import { fillMissingDays } from '$lib/utils.js';
import { eq } from 'drizzle-orm';
import { and, gte, lte, sql } from 'drizzle-orm/sql';
import * as v from 'valibot';

export const GET = async ({ params: { id }, url: u }) => {
	try {
		const { key, organizationId } = await authenticateAPI();
		const user = await db.query.user.findFirst({
			columns: { id: true, role: true },
			where: { id: key.userId }
		});
		if (!user) throw error(401, { message: errors_unauthorized() });
		const short = await db.query.url.findFirst({
			where: {
				id
			},
			with: { tags: true, teams: true }
		});

		if (!short) throw error(400, { message: m.errors_not_found() });

		let checkTeam = true;

		if (short.teams.length > 0) {
			const permissions =
				user.role === 'admin'
					? [true]
					: await Promise.all(
							short.teams.map(async (team) => {
								try {
									return await hasPermission({
										context: team.id,
										organizationId: team.organizationId,
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
			extended: v.pipe(
				v.optional(v.string()),
				v.transform((i) => (i === 'true' ? true : false))
			),
			from: v.pipe(
				v.optional(v.string(), startDate.toISOString()),
				v.transform((i) => new Date(i))
			),
			to: v.pipe(
				v.optional(v.string(), endDate.toISOString()),
				v.transform((i) => new Date(i))
			)
		});

		const { extended, from, to } = v.parse(
			ParamsSchema,
			Object.fromEntries(u.searchParams.entries())
		);
		if (!extended) {
			const rawStats = await db
				.select({
					day: sql`DATE(${metric.timestamp})`.mapWith((d) => new Date(d)).as('day'),
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
					and(eq(metric.urlId, short.id), gte(metric.timestamp, from), lte(metric.timestamp, to))
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
			return json({
				from,
				stats: {
					external: externalSeries,
					internal: internalSeries
				},
				to
			});
		} else {
			const metrics = await getOrganizationDashboardMetrics({
				from,
				organizationId,
				to,
				urlId: short.id,
				user: {
					id: user.id,
					role: user.role || 'user'
				}
			});
			return json(metrics);
		}
	} catch (err) {
		if (CONSTANTS.DEBUG) console.error(err);
		throw error((err as { statusCode?: number })?.statusCode || 500, {
			message: (err as { body?: { message?: string } })?.body?.message || m.errors_generic()
		});
	}
};

export const _openapi = {
	GET: defineEndpoint({
		description: m.api_url_metrics_description(),
		method: 'GET',
		query: UrlMetricsQuerySchema,
		queryParams: {
			extended: {
				description: m.api_url_metrics_extended_param(),
				example: 'true'
			},
			from: {
				description: m.api_url_metrics_from_param(),
				example: '2024-01-01T00:00:00.000Z'
			},
			to: {
				description: m.api_url_metrics_to_param(),
				example: '2024-01-08T23:59:59.999Z'
			}
		},
		responses: {
			200: {
				description: m.api_url_metrics_success(),
				schema: UrlMetricsResponseSchema
			},
			400: {
				description: m.errors_not_found()
			},
			401: {
				description: m.errors_unauthorized()
			},
			403: {
				description: m.errors_unauthorized()
			},
			500: {
				description: m.errors_generic()
			}
		},
		summary: m.api_url_metrics_summary(),
		tags: ['URLs']
	})
} as const;
