import { redirect } from '@sveltejs/kit';
import { getBetterAuth } from '$lib/auth/server';
import {  EnforcedPaginationSchema } from '$lib/schemas/pagination.schema';
import * as v from 'valibot';
export const load = async ({ locals: { user }, parent, request, url }) => {
	if (!user) redirect(307, '/auth/sign-in');
	const data = await parent();
	const auth = await getBetterAuth(data.host);
	const pagination = v.parse(EnforcedPaginationSchema, {...Object.fromEntries(url.searchParams.entries()), table:'apikey'});
	const apikeys = await auth.api.listApiKeys({
		headers: request.headers,
		query: {
			limit: pagination?.limit
		}
	});
	
	return { ...data, apikeys, columns: pagination.columns, limit: pagination?.limit };
};
