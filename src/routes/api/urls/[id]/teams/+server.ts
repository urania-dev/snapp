// src/routes/api/urls/[id]/teams/+server.ts
import { error, json } from '@sveltejs/kit';
import { defineEndpoint } from '@uraniadev/sveltekit-valibot-openapi';
import { errors_unauthorized, m } from '$lib/paraglide/messages';
import { hasPermission } from '$lib/remotes/auth.remote.js';
import { URLWithTeamSchema } from '$lib/schemas/urls.schema.js';
import { authenticateAPI } from '$lib/server/api/authenticate.js';
import { CONSTANTS } from '$lib/server/const.js';
import { db } from '$lib/server/db';
import { teamToUrl } from '$lib/server/db/schema.js';
import { and, eq, inArray } from 'drizzle-orm';
import * as v from 'valibot';

const UpdateUrlTeamsSchema = v.object({
	teams: v.array(v.string())
});

const PatchUrlTeamsSchema = v.object({
	add: v.optional(v.array(v.string())),
	remove: v.optional(v.array(v.string()))
});

export const PUT = async ({ params: { id }, request }) => {
	try {
		const { key } = await authenticateAPI();

		const user = await db.query.user.findFirst({
			columns: { id: true, role: true },
			where: { id: key.userId }
		});
		if (!user) throw error(401, { message: errors_unauthorized() });

		if (!id) throw error(404, { message: m.errors_not_found() });

		const body = await request.json();
		const { teams: teamsInput } = v.parse(UpdateUrlTeamsSchema, body);

		const normalizedTeamIds = Array.from(
			new Set(
				teamsInput
					.map((t) => t.trim())
					.filter((t) => t.length > 0)
			)
		);

		const existing = await db.query.url.findFirst({
			where: { id },
			with: { teams: true }
		});

		if (!existing) throw error(404, { message: m.errors_not_found() });

		const isOwner = existing.userId === user.id;
		const isAdmin = user.role === 'admin';

		// Replacing all team relations is restricted to owner and admins
		if (!isOwner && !isAdmin) {
			throw error(403, { message: m.errors_unauthorized() });
		}

		const targetTeams =
			normalizedTeamIds.length === 0
				? []
				: await db.query.team.findMany({
						where: { id: { in: normalizedTeamIds } }
					});

		// If some team IDs do not exist, treat as client error
		if (targetTeams.length !== normalizedTeamIds.length) {
			throw error(400, { message: m.errors_generic() });
		}

		// Non-admin owner: must actually be allowed on each team
		if (!isAdmin && targetTeams.length > 0) {
			const permissions = await Promise.all(
				targetTeams.map(async (t) => {
					try {
						return await hasPermission({
							context: t.id,
							organizationId: t.organizationId,
							permissions: ['update']
						});
					} catch (e) {
						if (CONSTANTS.DEBUG) console.error(e);
						return false;
					}
				})
			);
			const allAllowed = permissions.every(Boolean);
			if (!allAllowed) {
				throw error(403, { message: m.errors_unauthorized() });
			}
		}

		await db.transaction(async (tx) => {
			// Remove all existing team relations
			await tx.delete(teamToUrl).where(eq(teamToUrl.urlId, id));

			// Attach to the new set of teams
			if (targetTeams.length > 0) {
				await tx
					.insert(teamToUrl)
					.values(
						targetTeams.map((tRow) => ({
							teamId: tRow.id,
							urlId: id
						}))
					)
					.onConflictDoNothing();
			}
		});

		const updated = await db.query.url.findFirst({
			where: { id },
			with: {  teams: true }
		});

		if (!updated) throw error(500, { message: m.errors_generic() });

		return json(updated);
	} catch (err) {
		if (CONSTANTS.DEBUG) console.error('Updating URL teams (PUT)', err);
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
		const { key } = await authenticateAPI();

		const user = await db.query.user.findFirst({
			columns: { id: true, role: true },
			where: { id: key.userId }
		});
		if (!user) throw error(401, { message: errors_unauthorized() });

		if (!id) throw error(404, { message: m.errors_not_found() });

		const body = await request.json();
		const { add, remove } = v.parse(PatchUrlTeamsSchema, body);

		const addTeams = Array.from(
			new Set(
				(add ?? [])
					.map((t) => t.trim())
					.filter((t) => t.length > 0)
			)
		);

		const removeTeams = Array.from(
			new Set(
				(remove ?? [])
					.map((t) => t.trim())
					.filter((t) => t.length > 0)
			)
		);

		if (addTeams.length === 0 && removeTeams.length === 0) {
			throw error(400, { message: m.errors_generic() });
		}

		const existing = await db.query.url.findFirst({
			where: { id },
			with: { teams: true }
		});

		if (!existing) throw error(404, { message: m.errors_not_found() });

		const isOwner = existing.userId === user.id;
		const isAdmin = user.role === 'admin';

		const teamsToAdd =
			addTeams.length === 0
				? []
				: await db.query.team.findMany({
						where: { id: { in: addTeams } }
					});

		const teamsToRemove =
			removeTeams.length === 0
				? []
				: await db.query.team.findMany({
						where: { id: { in: removeTeams } }
					});

		if (teamsToAdd.length !== addTeams.length || teamsToRemove.length !== removeTeams.length) {
			throw error(400, { message: m.errors_generic() });
		}

		// ADD: only owner or admin can attach URL to teams
		if (teamsToAdd.length > 0) {
			if (!isOwner && !isAdmin) {
				throw error(403, { message: m.errors_unauthorized() });
			}

			if (!isAdmin) {
				const permissions = await Promise.all(
					teamsToAdd.map(async (t) => {
						try {
							return await hasPermission({
								context: t.id,
								organizationId: t.organizationId,
								permissions: ['update']
							});
						} catch (e) {
							if (CONSTANTS.DEBUG) console.error(e);
							return false;
						}
					})
				);
				const allAllowed = permissions.every(Boolean);
				if (!allAllowed) {
					throw error(403, { message: m.errors_unauthorized() });
				}
			}
		}

		// REMOVE: owner/admin can always; non-owner needs update permission on those teams
		if (teamsToRemove.length > 0 && !isAdmin && !isOwner) {
			const permissions = await Promise.all(
				teamsToRemove.map(async (t) => {
					try {
						return await hasPermission({
							context: t.id,
							organizationId: t.organizationId,
							permissions: ['update']
						});
					} catch (e) {
						if (CONSTANTS.DEBUG) console.error(e);
						return false;
					}
				})
			);
			const allAllowed = permissions.every(Boolean);
			if (!allAllowed) {
				throw error(403, { message: m.errors_unauthorized() });
			}
		}

		await db.transaction(async (tx) => {
			if (teamsToRemove.length > 0) {
				await tx
					.delete(teamToUrl)
					.where(
						and(
							eq(teamToUrl.urlId, id),
							inArray(
								teamToUrl.teamId,
								teamsToRemove.map((tRow) => tRow.id)
							)
						)
					);
			}

			if (teamsToAdd.length > 0) {
				await tx
					.insert(teamToUrl)
					.values(
						teamsToAdd.map((tRow) => ({
							teamId: tRow.id,
							urlId: id
						}))
					)
					.onConflictDoNothing();
			}
		});

		const updated = await db.query.url.findFirst({
			where: { id },
			with: {  teams: true }
		});

		if (!updated) throw error(500, { message: m.errors_generic() });

		return json(updated);
	} catch (err) {
		if (CONSTANTS.DEBUG) console.error('Updating URL teams (PATCH)', err);
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
		if (!user) throw error(401, { message: errors_unauthorized() });

		if (!id) throw error(404, { message: m.errors_not_found() });

		const existing = await db.query.url.findFirst({
			where: { id },
			with: { teams: true }
		});

		if (!existing) throw error(404, { message: m.errors_not_found() });

		const isOwner = existing.userId === user.id;
		const isAdmin = user.role === 'admin';

		// Only owner and admins can wipe all team relations
		if (!isOwner && !isAdmin) {
			throw error(403, { message: m.errors_unauthorized() });
		}

		await db.delete(teamToUrl).where(eq(teamToUrl.urlId, id));

		return json(null, { status: 204 });
	} catch (err) {
		if (CONSTANTS.DEBUG) console.error('Deleting URL teams', err);
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
		description: m.api_url_teams_delete_description(),
		method: 'DELETE',
		responses: {
			204: { description: m.deleted() },
			401: { description: m.errors_unauthorized() },
			403: { description: m.errors_unauthorized() },
			404: { description: m.errors_not_found() },
			500: { description: m.errors_generic() }
		},
		summary: m.api_url_teams_delete_summary(),
		tags: ['URLs']
	}),

	PATCH: defineEndpoint({
		body: {
			content: {
				'application/json': PatchUrlTeamsSchema
			},
			description: m.api_url_teams_patch_body_description(),
			required: true
		},
		description: m.api_url_teams_patch_description(),
		method: 'PATCH',
		responses: {
			200: {
				description: m.api_url_teams_mutation_success(),
				schema: URLWithTeamSchema
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
		summary: m.api_url_teams_patch_summary(),
		tags: ['URLs']
	}),

	PUT: defineEndpoint({
		body: {
			content: {
				'application/json': UpdateUrlTeamsSchema
			},
			description: m.api_url_teams_post_body_description(),
			required: true
		},
		description: m.api_url_teams_post_description(),
		method: 'PUT',
		responses: {
			200: {
				description: m.api_url_teams_mutation_success(),
				schema: URLWithTeamSchema
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
		summary: m.api_url_teams_post_summary(),
		tags: ['URLs']
	})
} as const;
