import { error, json } from '@sveltejs/kit';
import { defineEndpoint } from '@uraniadev/sveltekit-valibot-openapi';
import { m } from '$lib/paraglide/messages';
import { hasPermission } from '$lib/remotes/auth.remote.js';
import { authenticateAPI } from '$lib/server/api/authenticate.js';
import { CONSTANTS } from '$lib/server/const.js';
import { db } from '$lib/server/db';
import { tag } from '$lib/server/db/schema.js';
import { generateId } from 'better-auth';
import { asc, count, ilike, inArray } from 'drizzle-orm';
import * as v from 'valibot';

const TagListParamsSchema = v.pipe(
	v.object({
		expand: v.optional(v.string()),
		fields: v.optional(v.string()),
		limit: v.pipe(
			v.optional(v.string()),
			v.transform((i) => (i && !isNaN(parseInt(i)) ? parseInt(i) : 50))
		),
		page: v.pipe(
			v.optional(v.string()),
			v.transform((i) => (i && !isNaN(parseInt(i)) ? parseInt(i) : 1))
		),
		query: v.nullish(v.string())
	}),
	v.transform((input) => {
		const limit = input.limit ?? 50;
		const page = Math.max(input.page ?? 1, 1);
		const offset = (page - 1) * limit;

		const expand =
			input.expand && input.expand.trim().length > 0
				? input.expand
						.split(',')
						.map((t) => t.trim())
						.filter((t) => t.length > 0)
				: [];

		const fields =
			input.fields && input.fields.trim().length > 0
				? input.fields
						.split(',')
						.map((t) => t.trim())
						.filter((t) => t.length > 0)
				: [];

		return { ...input, expand, fields, limit, offset, page };
	})
);

const CreateTagSchema = v.object({
	tags: v.array(
		v.pipe(
			v.string(),
			v.transform((s) => s.trim())
		)
	)
});

const TagSchema = v.object({
	id: v.string(),
	tag: v.string(),
	urls: v.optional(
		v.array(
			v.object({
				id: v.string(),
				originalUrl: v.string(),
				shortcode: v.nullish(v.string())
			})
		)
	)
});

export const GET = async ({ url: u }) => {
	try {
		const { key, organizationId } = await authenticateAPI();

		const user = await db.query.user.findFirst({
			columns: { id: true, role: true },
			where: { id: key.userId }
		});
		if (!user) throw error(401, { message: m.errors_unauthorized() });

		const isAdmin = user.role === 'admin';

		const params = v.parse(TagListParamsSchema, Object.fromEntries(u.searchParams.entries()));
		const search = params.query?.trim() ?? '';
		const expandUrls = params.expand.includes('urls');

		const hasFieldFilters = params.fields.length > 0;

		const tagFieldSet = new Set<string>();
		const urlFieldSet = new Set<string>();

		if (hasFieldFilters) {
			for (const field of params.fields) {
				if (!field.includes('.')) {
					tagFieldSet.add(field);
				} else if (field.startsWith('urls.')) {
					const col = field.slice('urls.'.length);
					urlFieldSet.add(col);
				}
			}
			if (!tagFieldSet.has('id')) tagFieldSet.add('id');
			if (expandUrls && !urlFieldSet.has('id')) urlFieldSet.add('id');
		}

		const [{count:total}] =await db.select({ count: count() }).from(tag).where(search?.length ? ilike(tag.tag, `%${search}%`):undefined);
		

		if (!expandUrls) {
			const tagsRows = await db.query.tag.findMany({
				limit: params.limit,
				offset: params.offset,
				orderBy: { tag: 'asc' },
				where: search
					? {
							tag: {
								ilike: `%${search}%`
							}
						}
					: undefined
			});

			const projected = hasFieldFilters
				? tagsRows.map((t) => {
						const out: { id?: string; tag?: string } = {};
						if (tagFieldSet.has('id')) out.id = t.id;
						if (tagFieldSet.has('tag')) out.tag = t.tag;
						return out;
					})
				: tagsRows;

			return json({
				_count: total,
				_limit: params.limit,
				_offset: params.offset,
				tags: projected
			});
		}

		const rawTags = await db.query.tag.findMany({
			limit: params.limit,
			offset: params.offset,
			orderBy: { tag: 'asc' },
			where: search
				? {
						tag: {
							ilike: `%${search}%`
						}
					}
				: undefined,
			with: {
				urls: {
					columns: {
						id: true,
						organizationId: true,
						originalUrl: true,
						shortcode: true,
						userId: true
					},
					where: {
						organizationId
					},
					with: {
						teams: {
							columns: {
								id: true,
								organizationId: true
							}
						}
					}
				}
			}
		});

		const projectUrls = (
			urls: {
				id: string;
				originalUrl: string;
				shortcode: null | string;
			}[]
		) => {
			if (!hasFieldFilters || urlFieldSet.size === 0) {
				return urls.map((uRow) => ({
					id: uRow.id,
					originalUrl: uRow.originalUrl,
					shortcode: uRow.shortcode
				}));
			}

			return urls.map((uRow) => {
				const out: { id?: string; originalUrl?: string; shortcode?: null | string } = {};
				if (urlFieldSet.has('id')) out.id = uRow.id;
				if (urlFieldSet.has('originalUrl')) out.originalUrl = uRow.originalUrl;
				if (urlFieldSet.has('shortcode')) out.shortcode = uRow.shortcode;
				return out;
			});
		};

		const projectTag = (
			t: {
				id: string;
				tag: string;
			},
			urls: ReturnType<typeof projectUrls>
		) => {
			if (!hasFieldFilters || tagFieldSet.size === 0) {
				return {
					id: t.id,
					tag: t.tag,
					urls
				};
			}

			const out: {
				id?: string;
				tag?: string;
				urls?: ReturnType<typeof projectUrls>;
			} = {};

			if (tagFieldSet.has('id')) out.id = t.id;
			if (tagFieldSet.has('tag')) out.tag = t.tag;
			out.urls = urls;

			return out;
		};

		if (isAdmin) {
			const projected = rawTags.map((t) => {
				const urls = projectUrls(
					t.urls.map((uRow) => ({
						id: uRow.id,
						originalUrl: uRow.originalUrl,
						shortcode: uRow.shortcode
					}))
				);
				return projectTag(t, urls);
			});

			return json({
				_count: total,
				_limit: params.limit,
				_offset: params.offset,
				tags: projected
			});
		}

		const permissionCache = new Map<string, boolean>();

		const filtered = await Promise.all(
			rawTags.map(async (t) => {
				const visibleUrls: {
					id: string;
					originalUrl: string;
					shortcode: null | string;
				}[] = [];

				for (const uRow of t.urls) {
					const isOwner =
						uRow.userId === key.userId && uRow.organizationId === organizationId;

					if (isOwner) {
						visibleUrls.push({
							id: uRow.id,
							originalUrl: uRow.originalUrl,
							shortcode: uRow.shortcode
						});
						continue;
					}

					let allowedByTeam = false;

					for (const team of uRow.teams) {
						const cacheKey = `${team.organizationId}:${team.id}`;
						let allowed = permissionCache.get(cacheKey);

						if (allowed === undefined) {
							try {
								allowed = await hasPermission({
									context: team.id,
									organizationId: team.organizationId,
									permissions: ['read']
								});
							} catch (e) {
								if (CONSTANTS.DEBUG) console.error(e);
								allowed = false;
							}
							permissionCache.set(cacheKey, allowed);
						}

						if (allowed) {
							allowedByTeam = true;
							break;
						}
					}

					if (allowedByTeam) {
						visibleUrls.push({
							id: uRow.id,
							originalUrl: uRow.originalUrl,
							shortcode: uRow.shortcode
						});
					}
				}

				const urls = projectUrls(visibleUrls);
				return projectTag(t, urls);
			})
		);

		return json({
			_count: total,
			_limit: params.limit,
			_offset: params.offset,
			tags: filtered
		});
	} catch (err) {
		if (CONSTANTS.DEBUG) console.error('Listing tags', err);
		throw error((err as { statusCode?: number })?.statusCode || 500, {
			message:
				(err as { body?: { message?: string } })?.body?.message ||
				(err as { message?: string })?.message ||
				m.errors_generic()
		});
	}
};

export const POST = async ({ request }) => {
	try {
		await authenticateAPI();

		const body = await request.json();
		const parsed = v.parse(CreateTagSchema, body);

		const normalizedTags = Array.from(
			new Set(parsed.tags.map((t) => t.trim()).filter((t) => t.length > 0))
		);

		if (normalizedTags.length === 0) {
			throw error(400, { message: m.errors_generic() });
		}

		await db
			.insert(tag)
			.values(normalizedTags.map((value) => ({ id: generateId(8), tag: value })))
			.onConflictDoNothing();

		const created = await db
			.select()
			.from(tag)
			.where(inArray(tag.tag, normalizedTags))
			.orderBy(asc(tag.tag));

		return json(created, { status: 201 });
	} catch (err) {
		if (CONSTANTS.DEBUG) console.error('Creating tags', err);
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
		description: m.api_tag_list_description(),
		method: 'GET',
		query: TagListParamsSchema,
		queryParams: {
			expand: {
				description: m.api_expand(),
				example: 'urls'
			},
			fields: {
				description: m.api_fields(),
				example: 'id,tag,urls.id,urls.shortcode'
			},
			limit: {
				description: m.api_tag_list_limit_description(),
				example: '50'
			},
			page: {
				description: m.api_tag_list_page_description(),
				example: '1'
			},
			query: {
				description: m.api_tag_list_query_description(),
				example: 'marketing'
			}
		},
		responses: {
			200: {
				description: m.api_tag_list_success(),
				schema: v.array(TagSchema)
			},
			401: {
				description: m.errors_unauthorized()
			},
			500: {
				description: m.errors_generic()
			}
		},
		summary: m.api_tag_list_summary(),
		tags: ['Tags']
	}),
	POST: defineEndpoint({
		body: {
			content: {
				'application/json': CreateTagSchema
			},
			description: m.api_tag_create_body_description(),
			required: true
		},
		description: m.api_tag_create_description(),
		method: 'POST',
		responses: {
			201: {
				description: m.api_tag_create_success(),
				schema: v.array(TagSchema)
			},
			400: {
				description: m.errors_generic()
			},
			401: {
				description: m.errors_unauthorized()
			},
			500: {
				description: m.errors_generic()
			}
		},
		summary: m.api_tag_create_summary(),
		tags: ['Tags']
	})
} as const;

