import { error, json } from '@sveltejs/kit';
import { defineEndpoint } from '@uraniadev/sveltekit-valibot-openapi';
import { m } from '$lib/paraglide/messages';
import { getHost } from '$lib/remotes/config.remote.js';
import { vtapiValidity } from '$lib/remotes/vtapi.remote';
import { ApiParamsSchema, BuildRelationsFromParams } from '$lib/schemas/pagination.schema.js';
import {
	CreateURLSchema,
	PostURLSchema,
	URLListResponseSchema,
	URLRecordSchema
} from '$lib/schemas/urls.schema';
import { authenticateAPI } from '$lib/server/api/authenticate.js';
import { CONSTANTS } from '$lib/server/const.js';
import { db } from '$lib/server/db';
import { url } from '$lib/server/db/schema';
import { domainFromUrl } from '$lib/utils.js';
import { generateId } from 'better-auth';
import { hashPassword } from 'better-auth/crypto';
import { and, count, eq, sql } from 'drizzle-orm';
import * as v from 'valibot';

export const GET = async ({ url: u }) => {
		const { key, organizationId } = await authenticateAPI();
		const params = v.parse(ApiParamsSchema, Object.fromEntries(u.searchParams.entries()));
		const relations = BuildRelationsFromParams(params.expand, params.fields);

				const user = await db.query.user.findFirst({
					columns: { id: true, role: true },
					where: { id: key.userId }
				});
				if (!user) throw error(401, { message: m.errors_unauthorized() });
		
			
		const urls = db.query.url.findMany({
			limit: params.limit,
			offset: params.offset,
			orderBy: params.sort
				? {
						[params.sort]: params.desc ? 'desc' : 'asc'
					}
				: undefined,
			where: {
				AND: [
					{ organizationId: user.role === 'admin'? undefined: organizationId, userId: user.role === 'admin'? undefined: key.userId },
					params.tags && params.tags?.length > 0
						? {
								tags: {
									tag: {
										in: params.tags
									}
								}
							}
						: undefined,
					params.query
						? {
								OR: [
									{ notes: { ilike: `%${params.query}%` } },
									{ originalUrl: { ilike: `%${params.query}%` } }
								]
							}
						: undefined
				].filter((f) => !!f)
			},
			...(relations?.columns ? { columns: relations.columns } : {}),
			...(relations?.with
				? {
						with: relations.with as Record<
							string,
							{ columns?: Record<string, true>; with?: Record<string, unknown> }
						>
					}
				: {}),
			extras:
				relations?.columns?.['secret'] === true
					? {
							secret: (url) => sql<boolean>`(${url.secret} is not null)`.as('secret_not_null')
						}
					: undefined
		});

		return json({
			_count: await db
				.select({ count: count() })
				.from(url)
				.where(and(eq(url.userId, key.userId), eq(url.organizationId, organizationId)))
				.then(([{ count }]) => count),
			_limit: params.limit,
			_offset: params.offset,
			urls: await urls
		});
};

export const POST = async (event) => {
	try {
		const { key, organizationId } = await authenticateAPI();
		const body = await event.request.json();

		const { _secret, expiresAt, utms, ...newURL } = await v.parseAsync(CreateURLSchema, body);

		const host = await getHost();

		const [{ count: countURL }] = await db
			.select({ count: count() })
			.from(url)
			.where(eq(url.userId, key.userId));

		if (
			host.options.disable.limits === false &&
			host.options.limits &&
			countURL >= host.options.limits.maxSnappPerUser
		) {
			throw error(403, { message: m.errors_max_count_reached() });
		}

		const domain = domainFromUrl(newURL.originalUrl);
		const blacklisted = await db.query.watchlist.findFirst({
			where: { allowed: false, domain, username: { isNull: true } }
		});

		const validForAPI = await vtapiValidity(domain);
		if (!validForAPI || blacklisted) throw error(403, { message: m.errors_blacklisted_url() });

		const utm = Object.fromEntries(utms.map((u) => [u.key, u]));

		const expiration = expiresAt ? new Date(Date.now() + expiresAt) : null;
		const secret = _secret ? await hashPassword(_secret) : undefined;

		const [created] = await db
			.insert(url)
			.values({
				...newURL,
				active: true,
				expiresAt: expiration,
				hit: 0,
				id: generateId(24),
				organizationId,
				secret,
				shortcode: newURL.shortcode?.trim() || undefined,
				userId: key.userId,
				utm
			})
			.returning();

		return json(created);
	} catch (err) {
		if (CONSTANTS.DEBUG) console.error('Inserting a new row', err);
		throw error((err as { statusCode?: number })?.statusCode || 500, {
			message:
				(err as { body?: { message?: string } })?.body?.message ||
				(err as { message?: string })?.message ||
				m.errors_generic()
		});
	}
};

export const fallback = () => {
	throw error(405);
};
export const _openapi = {
	GET: defineEndpoint({
		description: m.api_url_description(),
		method: 'GET',
		query: ApiParamsSchema,
		queryParams: {
			desc: {
				description: m.api_desc(),
				example: true
			},
			expand: {
				description: m.api_expand(),
				example: 'user,tags'
			},
			fields: {
				description: m.api_fields(),
				example: 'id,originalUrl,shortcode'
			},
			limit: {
				description: m.api_page_limit(),
				example: 50
			},
			offset: {
				description: m.api_offset(),
				example: 0
			},
			page:{
				description: m.api_page(),
			},
			query: {
				description: m.api_query(),
				example: 'newsletter signup'
			},
			sort: {
				description: m.api_sort(),
				example: 'createdAt'
			},
			tags: {
				description: m.api_tags(),
				examples: [['campaign-a'], ['utm:twitter', 'campaign-b']]
			}
		},
		responses: {
			200: {
				description: m.api_url_helper(),
				schema: URLListResponseSchema
			},
			401: {
				description: m.errors_unauthorized()
			},
			403: {
				description: m.errors_unrecognized_host()
			}
		},
		summary: m.api_url_summary(),
		tags: ['URLs']
	}),
	POST: defineEndpoint({
		body: {
			content: {
				'application/json': PostURLSchema
			},
			description: m.api_url_create_body_description(),
			required: true
		},
		description: m.api_url_create_description(),
		method: 'POST',
		responses: {
			200: {
				description: m.api_url_create_success(),
				schema: URLRecordSchema
			},
			401: {
				description: m.errors_unauthorized()
			},
			403: {
				description: m.errors_forbidden()
			},
			500: {
				description: m.errors_generic()
			}
		},
		summary: m.api_url_create_summary(),
		tags: ['URLs']
	})
} as const;
