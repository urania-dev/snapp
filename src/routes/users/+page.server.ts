import { redirect } from '@sveltejs/kit';
import { getBetterAuth } from '$lib/auth/server';
import { EnforcedPaginationSchema } from '$lib/schemas/pagination.schema.js';
import { slugify } from '$lib/utils.js';
import * as v from 'valibot';
export const load = async ({ depends, locals: { user }, parent, request, url }) => {
	depends('users:load');
	if (!user) redirect(307, '/auth/sign-in');
	if (user.role === 'user') redirect(307, '/auth/dashboard');
	const pagination = v.parse(EnforcedPaginationSchema, {
		...Object.fromEntries(url.searchParams.entries()),
		table: 'user'
	});
	const data = await parent();
	const auth = await getBetterAuth(data.host);
	const organizationId = slugify(data.host.origin);
	const memberQuery = await auth.api.listUsers({
		headers: request.headers,
		query: {
			filterField: (pagination.query && 'name') || undefined,
			filterOperator: pagination.query ? 'contains' : undefined,
			filterValue: (pagination.query && `%${pagination.query}%`) || undefined,
			limit: pagination.limit,
			offset: pagination.offset,
			sortBy: pagination.sort,
			sortDirection: pagination.desc ? 'desc' : 'asc'
		}
	});

	return {
		...data,
		columnVisibility: pagination.columns,
		count: memberQuery?.total,
		limit: pagination.limit,
		organizationId,
		users: memberQuery?.users || []
	};
};
