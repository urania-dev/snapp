
import { error, json } from '@sveltejs/kit';
import { defineEndpoint } from '@uraniadev/sveltekit-valibot-openapi';
import {  m } from '$lib/paraglide/messages';
import { hasPermission } from '$lib/remotes/auth.remote.js';
import { vtapiValidity } from '$lib/remotes/vtapi.remote';
import { ApiParamsSchema, BuildRelationsFromParams } from '$lib/schemas/pagination.schema.js';
import { PatchURLSchema, URLWithTagAndTeamSchema } from '$lib/schemas/urls.schema.js';
import { authenticateAPI } from '$lib/server/api/authenticate.js';
import { CONSTANTS } from '$lib/server/const.js';
import { db } from '$lib/server/db';
import { url } from '$lib/server/db/schema.js';
import { domainFromUrl } from '$lib/utils.js';
import { hashPassword } from 'better-auth/crypto';
import { eq, sql } from 'drizzle-orm';
import * as v from 'valibot';

export const GET = async ({ params: { id }, url: u }) => {
	try {
		const { key } = await authenticateAPI();

		const params = v.parse(ApiParamsSchema, Object.fromEntries(u.searchParams.entries()));
		const relations = BuildRelationsFromParams(params.expand, params.fields);

		const user = await db.query.user.findFirst({
			columns: { id: true, role: true },
			where: { id: key.userId }
		});
		if (!user) throw error(401, { message: m.errors_unauthorized() });

	
		const existing = await db.query.url.findFirst({
			where: { id },
			with: { teams: true }
		});

		if (!existing) throw error(400, { message: m.errors_not_found() });

		let allowedByTeams = true;

		if (existing.teams.length > 0) {
			const permissions =
				user.role === 'admin'
					? [true]
					: await Promise.all(
							existing.teams.map(async (team) => {
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

			allowedByTeams = permissions.some((p) => p === true);
		}

		if (!allowedByTeams) throw error(403, { message: m.errors_unauthorized() });

	
		const short = await db.query.url.findFirst({
			where: { id },
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
				relations?.columns?.secret === true
					? {
							secret: (fields) =>
								sql<boolean>`(${fields.secret} is not null)`
						}
					: undefined
		});

		if (!short) throw error(400, { message: m.errors_not_found() });

		return json(short);
	} catch (err) {
		if (CONSTANTS.DEBUG) console.error(err);
		throw error((err as { statusCode?: number })?.statusCode || 500, {
			message: (err as { body?: { message?: string } })?.body?.message || m.errors_generic()
		});
	}
};

export const PATCH = async ({ params: { id }, request, url: u }) => {
	try {
		const { key, organizationId } = await authenticateAPI();

		const params = v.parse(ApiParamsSchema, Object.fromEntries(u.searchParams.entries()));
		const relations = BuildRelationsFromParams(params.expand, params.fields);

		const user = await db.query.user.findFirst({
			columns: { id: true, role: true },
			where: { id: key.userId }
		});
		if (!user) throw error(401, { message: m.errors_unauthorized() });

		const body = await request.json();
		const { _secret, expiresAt, removeExpiration, removeSecret, utms, ...update } =
			await v.parseAsync(PatchURLSchema, body);

		const domain = update.originalUrl ? domainFromUrl(update.originalUrl) : null;

		const blacklisted = domain
			? await db.query.watchlist.findFirst({
					where: { allowed: false, domain, username: { isNull: true } }
				})
			: false;

		const validForAPI = domain ? await vtapiValidity(domain) : true;
		if (!validForAPI || blacklisted) throw error(403, { message: m.errors_blacklisted_url() });

		if (!id) throw error(404, { message: m.errors_generic() });

	
		const existing = await db.query.url.findFirst({
			where: { id },
			with: { teams: true }
		});
		if (!existing) throw error(404, { message: m.errors_not_found() });

		let allowed = existing.userId === user.id || user.role === 'admin';

		if (!allowed && existing.teams.length > 0) {
			const permissions = await Promise.all(
				existing.teams.map(async (team) => {
					try {
						return await hasPermission({
							context: team.id,
							organizationId,
							permissions: ['update']
						});
					} catch {
						return false;
					}
				})
			);
			allowed = permissions.some(Boolean);
		}

		if (!allowed) throw error(403, { message: m.errors_unauthorized() });

		const utm = Object.fromEntries(utms.map((u) => [u.key, u])) as Record<
			string,
			Record<string, string>
		>;

		const secret = _secret ? await hashPassword(_secret) : undefined;
		const expiration = expiresAt ? new Date(new Date().getTime() + expiresAt) : null;

		const updated = await db.transaction(async (tx) => {
			const [row] = await tx
				.update(url)
				.set({
					...update,
					expiresAt: removeExpiration ? null : expiration,
					secret: removeSecret ? null : secret,
					utm
				})
				.where(eq(url.id, id))
				.returning();

			return row;
		});

		if (!updated) {
			throw error(500, { message: m.errors_generic() });
		}

	
		const expanded = await db.query.url.findFirst({
			where: { id },
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
				relations?.columns?.secret === true
					? {
							secret: (fields) =>
								sql<boolean>`(${fields.secret} is not null)`
						}
					: undefined
		});

		return json(expanded ?? updated);
	} catch (err) {
		if (CONSTANTS.DEBUG) console.error('Updating URL', err);
		throw error((err as { statusCode?: number })?.statusCode || 500, {
			message:
				(err as { body?: { message?: string } })?.body?.message ||
				(err as { message?: string })?.message ||
				m.errors_generic()
		});
	}
};

export const DELETE = async ({ params: { id } }) => {
	try {
		const { key } = await authenticateAPI();
		const user = await db.query.user.findFirst({
			columns: { id: true, role: true },
			where: { id: key.userId }
		});

		if (!user) throw error(401, { message: m.errors_unauthorized() });

		const existing = await db.query.url.findFirst({
			where: { id },
			with: { teams: true }
		});

		if (!existing) throw error(404, { message: m.errors_not_found() });

		const allowed = existing.userId === user.id || user.role === 'admin';

		if (!allowed) throw error(403, { message: m.errors_unauthorized() });

		await db.delete(url).where(eq(url.id, id));

		return json(null, { status: 204 });
	} catch (err) {
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
	DELETE: defineEndpoint({
		description: m.urls_delete_helper(),
		method: 'DELETE',
		responses: {
			204: { description: m.deleted() },
			401: { description: m.errors_unauthorized() },
			403: { description: m.errors_forbidden() },
			404: { description: m.errors_not_found() }
		},
		summary: m.api_url_delete_summary(),
		tags: ['URLs']
	}),

	GET: defineEndpoint({
		description: m.api_single_url_description(),
		method: 'GET',
		query: ApiParamsSchema,
		queryParams: {
			expand: {
				description: m.api_expand(),
				example: 'user,tags'
			},
			fields: {
				description: m.api_fields(),
				example: 'id,originalUrl,shortcode'
			}
		},
		responses: {
			200: {
				description: m.api_single_url_helper(),
				schema: URLWithTagAndTeamSchema
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
		summary: m.api_single_url_summary(),
		tags: ['URLs']
	}),

	PATCH: defineEndpoint({
		body: {
			content: {
				'application/json': PatchURLSchema
			},
			description: m.api_url_update_body_description(),
			required: true
		},
		description: m.api_url_update_description(),
		method: 'PATCH',
		query: ApiParamsSchema,
		queryParams: {
			expand: {
				description: m.api_expand(),
				example: 'user,tags'
			},
			fields: {
				description: m.api_fields(),
				example: 'id,originalUrl,shortcode'
			}
		},
		responses: {
			200: {
				description: m.api_url_update_success(),
				schema: URLWithTagAndTeamSchema
			},
			400: {
				description: m.errors_generic()
			},
			401: {
				description: m.errors_unauthorized()
			},
			403: {
				description: m.errors_unauthorized()
			},
			404: {
				description: m.errors_not_found()
			},
			500: {
				description: m.errors_generic()
			}
		},
		summary: m.api_url_update_summary(),
		tags: ['URLs']
	})
} as const;
