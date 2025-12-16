import { redirect } from '@sveltejs/kit';
import { db } from '$lib/server/db/index.js';
import { getOrganizationDashboardMetrics } from '$lib/server/metrics/helpers';
import * as v from 'valibot';

export const load = async ({ locals: { user }, parent, url }) => {
	if (!user) redirect(302, '/dashboard');

	const { activeOrganization: organization } = await parent();

	if (!organization?.id) {
		redirect(302, '/dashboard');
	}

	const endDate = new Date();
	endDate.setHours(23, 59, 59, 99);

	const startDate = new Date(endDate);
	startDate.setDate(endDate.getDate() - 7);

	const ParamsSchema = v.object({
		filter: v.pipe(
			v.optional(v.string(), ''),
			v.transform((i) => (i?.trim() !== '' ? JSON.parse(i) as Record<string,string> : {}))
		),
		from: v.pipe(
			v.optional(v.string(), startDate.toISOString()),
			v.transform((i) => new Date(i))
		),
		organizationId: v.optional(v.string()),
		to: v.pipe(
			v.optional(v.string(), endDate.toISOString()),
			v.transform((i) => new Date(i))
		),
		urlId: v.pipe(v.optional(v.string())),
		utms: v.pipe(
			v.optional(v.string(), ''),
			v.transform((i) => (i?.trim() !== '' ? i.split(',') : []))
		)
	});
	const { filter, from, organizationId, to, urlId, utms } = v.parse(
    ParamsSchema,
		Object.fromEntries(url.searchParams.entries())
	);

	const metrics = await getOrganizationDashboardMetrics({
		from,
		organizationId: organizationId || organization.id,
		to,
		urlId,
		user: {
			id: user.id,
			role: user.role || 'user'
		},
    utmFilter:filter,
    utmKeys:utms,
	});
	return {
		from,
		metrics,
		organizations:
			user?.role === 'admin'
				? await db.query.organization
						.findMany({ columns: { id: true, metadata: true, name: true } })
						.then((res) =>
							res.map((o) => ({
								...o,
								metadata: JSON.parse(o?.metadata || '{}') as Record<string, string>
							}))
						)
				: [],
		queriedOrgId: organizationId,
		to
	};
};
