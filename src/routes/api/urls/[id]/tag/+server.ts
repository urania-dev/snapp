import { error, json } from '@sveltejs/kit';
import { defineEndpoint } from '@uraniadev/sveltekit-valibot-openapi';
import { errors_unauthorized, m } from '$lib/paraglide/messages';
import { hasPermission } from '$lib/remotes/auth.remote.js';
import { URLWithTagSchema } from '$lib/schemas/urls.schema.js';
import { authenticateAPI } from '$lib/server/api/authenticate.js';
import { CONSTANTS } from '$lib/server/const.js';
import { db } from '$lib/server/db';
import { tag, urlToTag } from '$lib/server/db/schema.js';
import { generateId } from 'better-auth';
import { and, eq, inArray } from 'drizzle-orm';
import * as v from 'valibot';

const UpdateUrlTagsSchema = v.object({
	tags: v.array(v.string())
});

const PatchUrlTagsSchema = v.object({
	add: v.optional(v.array(v.string())),
	remove: v.optional(v.array(v.string()))
});

export const PUT = async ({ params: { id }, request }) => {
	try {
		const { key, organizationId } = await authenticateAPI();

		const user = await db.query.user.findFirst({
			columns: { id: true, role: true },
			where: { id: key.userId }
		});
		if (!user) throw error(401, { message: errors_unauthorized() });

		if (!id) throw error(404, { message: m.errors_not_found() });

		const body = await request.json();
		const { tags } = v.parse(UpdateUrlTagsSchema, body);

		const normalizedTags = Array.from(
			new Set(
				tags
					.map((t) => t.trim())
					.filter((t) => t.length > 0)
			)
		);

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
					} catch (e) {
						if (CONSTANTS.DEBUG) console.error(e);
						return false;
					}
				})
			);
			allowed = permissions.some(Boolean);
		}

		if (!allowed) throw error(403, { message: m.errors_unauthorized() });

		await db.transaction(async (tx) => {
			if (normalizedTags.length > 0) {
				await tx
					.insert(tag)
					.values(
						normalizedTags.map((value) => ({
							id:generateId(8),
                            tag: value
						}))
					)
					.onConflictDoNothing();
			}

			const allTags =
				normalizedTags.length === 0
					? []
					: await tx.query.tag.findMany({
							where: {tag:{in:normalizedTags}}
						});

			await tx.delete(urlToTag).where(eq(urlToTag.urlId, id));

			if (allTags.length > 0) {
				await tx.insert(urlToTag).values(
					allTags.map((tRow) => ({
						tagId: tRow.id,
						urlId: id
					}))
				);
			}
		});

		const updated = await db.query.url.findFirst({
			where: { id },
			with: { tags: true}
		});

		if (!updated) throw error(500, { message: m.errors_generic() });

		return json(updated);
	} catch (err) {
		if (CONSTANTS.DEBUG) console.error('Updating URL tags (PUT)', err);
		throw error((err as { statusCode?: number })?.statusCode || 500, {
			message:
				(err as { body?: { message?: string } })?.body?.message ||
				(err as { message?: string })?.message ||
				m.errors_generic()
		});
	}
};

export const PATCH = async ({ params: { id }, request }) => {
	try {
		const { key, organizationId } = await authenticateAPI();

		const user = await db.query.user.findFirst({
			columns: { id: true, role: true },
			where: { id: key.userId }
		});
		if (!user) throw error(401, { message: errors_unauthorized() });

		if (!id) throw error(404, { message: m.errors_not_found() });

		const body = await request.json();
		const { add, remove } = v.parse(PatchUrlTagsSchema, body);

		const addTags = Array.from(
			new Set(
				(add ?? [])
					.map((t) => t.trim())
					.filter((t) => t.length > 0)
			)
		);

		const removeTags = Array.from(
			new Set(
				(remove ?? [])
					.map((t) => t.trim())
					.filter((t) => t.length > 0)
			)
		);

		if (addTags.length === 0 && removeTags.length === 0) {
			throw error(400, { message: m.errors_generic() });
		}

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
					} catch (e) {
						if (CONSTANTS.DEBUG) console.error(e);
						return false;
					}
				})
			);
			allowed = permissions.some(Boolean);
		}

		if (!allowed) throw error(403, { message: m.errors_unauthorized() });

		await db.transaction(async (tx) => {
			if (addTags.length > 0) {
				await tx
					.insert(tag)
					.values(
						addTags.map((value) => ({
							id:generateId(8),tag: value, 
						}))
					)
					.onConflictDoNothing();
			}

			const tagsToAdd =
				addTags.length === 0
					? []
					: await tx.query.tag.findMany({
							where: {tag:{in:addTags}}
						});

			const tagsToRemove =
				removeTags.length === 0
					? []
					: await tx.query.tag.findMany({
							where: {tag:{in:removeTags}}
						});

			if (tagsToRemove.length > 0) {
				await tx
					.delete(urlToTag)
					.where(
						and(
							eq(urlToTag.urlId, id),
							inArray(
								urlToTag.tagId,
								tagsToRemove.map((tRow) => tRow.id)
							)
						)
					);
			}

			if (tagsToAdd.length > 0) {
				await tx
					.insert(urlToTag)
					.values(
						tagsToAdd.map((tRow) => ({
							tagId: tRow.id,
							urlId: id
						}))
					)
					.onConflictDoNothing();
			}
		});

		const updated = await db.query.url.findFirst({
			where: { id },
			with: { tags: true,  }
		});

		if (!updated) throw error(500, { message: m.errors_generic() });

		return json(updated);
	} catch (err) {
		if (CONSTANTS.DEBUG) console.error('Updating URL tags (PATCH)', err);
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
		const { key, organizationId } = await authenticateAPI();

		const user = await db.query.user.findFirst({
			columns: { id: true, role: true },
			where: { id: key.userId }
		});
		if (!user) throw error(401, { message: errors_unauthorized() });

		if (!id) throw error(404, { message: m.errors_not_found() });

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
					} catch (e) {
						if (CONSTANTS.DEBUG) console.error(e);
						return false;
					}
				})
			);
			allowed = permissions.some(Boolean);
		}

		if (!allowed) throw error(403, { message: m.errors_unauthorized() });

		await db.delete(urlToTag).where(eq(urlToTag.urlId, id));

		return json(null, { status: 204 });
	} catch (err) {
		if (CONSTANTS.DEBUG) console.error('Deleting URL tags', err);
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
		description: m.api_url_tags_delete_description(),
		method: 'DELETE',
		responses: {
			204: { description: m.deleted() },
			401: { description: m.errors_unauthorized() },
			403: { description: m.errors_unauthorized() },
			404: { description: m.errors_not_found() },
			500: { description: m.errors_generic() }
		},
		summary: m.api_url_tags_delete_summary(),
		tags: ['URLs']
	}),

	PATCH: defineEndpoint({
		body: {
			content: {
				'application/json': PatchUrlTagsSchema
			},
			description: m.api_url_tags_patch_body_description(),
			required: true
		},
		description: m.api_url_tags_patch_description(),
		method: 'PATCH',
		responses: {
			200: {
				description: m.api_url_tags_mutation_success(),
				schema: URLWithTagSchema
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
		summary: m.api_url_tags_patch_summary(),
		tags: ['URLs']
	}),

	PUT: defineEndpoint({
		body: {
			content: {
				'application/json': UpdateUrlTagsSchema
			},
			description: m.api_url_tags_post_body_description(),
			required: true
		},
		description: m.api_url_tags_post_description(),
		method: 'PUT',
		responses: {
			200: {
				description: m.api_url_tags_mutation_success(),
				schema: URLWithTagSchema
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
		summary: m.api_url_tags_post_summary(),
		tags: ['URLs']
	})
} as const;
