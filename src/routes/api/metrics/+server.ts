import { error, json } from '@sveltejs/kit';
import { defineEndpoint } from '@uraniadev/sveltekit-valibot-openapi';
import { errors_unauthorized, m } from '$lib/paraglide/messages';
import { GlobalMetricsQuerySchema, UrlMetricsBreakdownSchema } from '$lib/schemas/metrics.schema';
import { authenticateAPI } from '$lib/server/api/authenticate.js';
import { CONSTANTS } from '$lib/server/const.js';
import { db } from '$lib/server/db';
import { getOrganizationDashboardMetrics } from '$lib/server/metrics/helpers.js';
import * as v from 'valibot';

export const GET = async ({ url: u }) => {
    try {
        const { key, organizationId } = await authenticateAPI();
        const user = await db.query.user.findFirst({
            columns: { id: true, role: true },
            where: { id: key.userId }
        });
        if (!user) throw error(401, { message: errors_unauthorized() });
      
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
            ),
            urlId: v.pipe(
                v.optional(v.string()),
            )
        });

        const { from, to, urlId } = v.parse(
            ParamsSchema,
            Object.fromEntries(u.searchParams.entries())
        );
           const metrics = await getOrganizationDashboardMetrics({
                from,
                organizationId,
                to,
                urlId,
                user: {
                    id: user.id,
                    role: user.role || 'user'
                }
            });
            return json(metrics);
    } catch (err) {
        if (CONSTANTS.DEBUG) console.error(err);
        throw error((err as { statusCode?: number })?.statusCode || 500, {
            message: (err as { body?: { message?: string } })?.body?.message || m.errors_generic()
        });
    }
};

export const _openapi = {
    GET: defineEndpoint({
        description: m.api_global_metrics_description(),
        method: 'GET',
        query: GlobalMetricsQuerySchema,
        queryParams: {
            from: {
                description: m.api_global_metrics_from_param(),
                example: '2024-01-01T00:00:00.000Z'
            },
            to: {
                description: m.api_global_metrics_to_param(),
                example: '2024-01-08T23:59:59.999Z'
            },
            urlId: {
                description: m.api_global_metrics_url_id(),
                example: 'KOmpnVPGyCdqHIG1J9e4XNJf'
            }
        },
        responses: {
            200: {
                description: m.api_global_metrics_success(),
                schema: UrlMetricsBreakdownSchema
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
        summary: m.api_global_metrics_summary(),
        tags: ['URLs']
    })
} as const;
