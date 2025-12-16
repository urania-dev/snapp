import { error, redirect } from '@sveltejs/kit';
import { command, form, getRequestEvent } from '$app/server';
import { m } from '$lib/paraglide/messages';
import { CreateURLSchema, UpdateURLSchema } from '$lib/schemas/urls.schema';
import { CONSTANTS } from '$lib/server/const';
import { db } from '$lib/server/db';
import { tag, teamToUrl, url, urlToTag } from '$lib/server/db/schema';
import { logNotFound, logSecretNotValid, logVisit } from '$lib/server/umami';
import { domainFromUrl, slugify } from '$lib/utils';
import { generateId } from 'better-auth';
import { hashPassword, verifyPassword } from 'better-auth/crypto';
import { count, eq, inArray } from 'drizzle-orm/sql';
import * as v from 'valibot';

import { hasPermission, requireUser } from './auth.remote';
import { getHost } from './config.remote';
import { vtapiValidity } from './vtapi.remote';

export const createTag = command(v.string(), async (_tag) => {
	await requireUser();

	const [t] = await db
		.insert(tag)
		.values({
			id: generateId(24),
			tag: _tag
		})
		.returning();

	return { t };
});

export const createURL = form(
	CreateURLSchema,
	async ({ _secret, expiresAt, tags, teams, utms, ...newURL }) => {
		const user = await requireUser();

		const [{ count: countURL }] = await db
			.select({ count: count() })
			.from(url)
			.where(eq(url.userId, user.id));
		const host = await getHost();
		if (
			host.options.disable.limits === false &&
			host.options.limits &&
			countURL >= host.options.limits.maxSnappPerUser
		)
			throw error(403, { message: m.errors_max_count_reached() });
		const organizationId = slugify(host.origin);
		const domain = domainFromUrl(newURL.originalUrl);
		const blacklisted = await db.query.watchlist.findFirst({
			where: {
				allowed: false,
				domain,
				username: { isNull: true }
			}
		});

		const validForAPI = await vtapiValidity(domain);
		if (!validForAPI || blacklisted) throw error(403, { message: m.errors_blacklisted_url() });

		let checkTeam = true;

		if (teams.length > 0) {
			const permissions = await Promise.all(
				teams.map(async (team) => {
					try {
						return await hasPermission({
							context: team,
							organizationId,
							permissions: ['create']
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

		const utm = Object.fromEntries(utms.map((u) => [u.key, u])) as Record<
			string,
			Record<string, string>
		>;

		try {
			await db.transaction(async (tx) => {
				const expiration = expiresAt ? new Date(new Date().getTime() + expiresAt) : null;
				const secret = _secret ? await hashPassword(_secret) : undefined;
				const [created] = await tx
					.insert(url)
					.values({
						...newURL,
						active: true,
						expiresAt: expiration,
						hit: 0,
						id: generateId(24),
						organizationId,
						secret,
						shortcode: newURL.shortcode?.trim() !== '' ? newURL.shortcode : undefined,
						userId: user.id,
						utm
					})
					.returning();
				if (!created) throw error(500, { message: m.errors_generic() });
				if (tags.length)
					await tx
						.insert(urlToTag)
						.values(tags.map((tagId) => ({ tagId, urlId: created.id })))
						.onConflictDoNothing();

				if (teams.length)
					await tx
						.insert(teamToUrl)
						.values(teams.map((teamId) => ({ teamId, urlId: created.id })))
						.onConflictDoNothing();
			});
		} catch (err) {
			if (CONSTANTS.DEBUG) console.error('Inserting a new row', err);
			throw error(500, { message: m.errors_generic() });
		}

		redirect(307, '/urls');
	}
);

export const updateURL = form(
	UpdateURLSchema,
	async ({ _secret, expiresAt, removeExpiration, removeSecret, tags, teams, utms, ...update }) => {
		const user = await requireUser();
		const {
			params: { id }
		} = getRequestEvent();

		const expiration = expiresAt ? new Date(new Date().getTime() + expiresAt) : null;

		const host = await getHost();

		const organizationId = slugify(host.origin);
		

        const domain = update.originalUrl ? domainFromUrl(update.originalUrl) : null;

        const blacklisted = domain  ? await db.query.watchlist.findFirst({
            where: { allowed: false, domain, username: { isNull: true } }
        }) : false;

        const validForAPI = domain ? await vtapiValidity(domain) :true
        if (!validForAPI || blacklisted) throw error(403, { message: m.errors_blacklisted_url() });

		if (!id) throw error(404, { message: m.errors_generic() });

		const existing = await db.query.url.findFirst({
			where: { id },
			with: { teams: true }
		});
		if (!existing) throw error(404, { message: m.errors_not_found() });

		let allowed = true;

		if (existing.userId !== user.id && user.role !== 'admin') {
			const uniqueTeams = Array.from(new Set([...existing.teams.map((t) => t.id), ...teams]));
			const permissions = await Promise.all(
				uniqueTeams.map(async (team) => {
					try {
						return await hasPermission({
							context: team,
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

		try {
				const secret = _secret ? await hashPassword(_secret) : undefined;

			await db.transaction(async (tx) => {
				const [updated] = await tx
					.update(url)
					.set({
						...update,
						expiresAt: removeExpiration ? null : expiration,
						secret: removeSecret ? null : secret,
						utm
					})
					.where(eq(url.id, id))
					.returning();

				await tx.delete(urlToTag).where(eq(urlToTag.urlId, updated.id));
				if (tags.length)
					await tx.insert(urlToTag).values(tags.map((tagId) => ({ tagId, urlId: updated.id })));

				await tx.delete(teamToUrl).where(eq(teamToUrl.urlId, updated.id));
				if (teams.length)
					await tx.insert(teamToUrl).values(teams.map((teamId) => ({ teamId, urlId: updated.id })));
			});
		} catch (err) {
			if (CONSTANTS.DEBUG) console.error('Updating a row %s', id, err);
			throw error(500, { message: m.errors_generic() });
		}

		redirect(307, '/urls');
	}
);

export const toggleURL = command(v.boolean(), async (value) => {
	const user = await requireUser();
	const {
		params: { id }
	} = getRequestEvent();
	if (!id) return { message: m.errors_not_found(), success: false };

	try {
		const record = await db.query.url.findFirst({
			where: { id },
			with: { teams: true }
		});
		if (!record) return { message: m.errors_not_found(), success: false };

		const isOwner = record.userId === user.id;
		let allowed = false;

		if (isOwner || user.role === 'admin') {
			allowed = true;
		} else {
			const teams = record.teams.map((t) => t.id);
			if (teams.length > 0) {
				const permissions = await Promise.all(
					teams.map(async (teamId) => {
						try {
							return await hasPermission({
								context: teamId,
								organizationId: slugify((await getHost()).origin),
								permissions: ['update']
							});
						} catch {
							return false;
						}
					})
				);
				if (permissions.some((p) => p === true)) allowed = true;
			}
		}

		if (!allowed) return { message: m.errors_unauthorized(), success: false };

		await db.update(url).set({ active: value }).where(eq(url.id, id));

		return { message: m.settings_saved(), success: true };
	} catch (err) {
		if (CONSTANTS.DEBUG) console.error(err);
		return { message: m.errors_settings_saving(), success: false };
	}
});

export const deleteUrl = command(v.array(v.string()), async (ids) => {
	const user = await requireUser();
	const host = await getHost();
	if (!host) throw error(400, { message: m.errors_unrecognized_host() });
	const organizationId = slugify(host.origin);
	const urls = await db.query.url.findMany({
		where: { id: { in: ids } },
		with: { teams: { columns: { id: true } } }
	});

	const deletable: string[] = [];

	for (const u of urls) {
		if (user.role === 'admin' || u.userId === user.id) {
			deletable.push(u.id);
			continue;
		}

		const teamIds = u.teams.map((t) => t.id);

		if (teamIds.length === 0) continue;

		const perms = await Promise.all(
			teamIds.map(async (teamId) => {
				try {
					return await hasPermission({
						context: teamId,
						organizationId,
						permissions: ['delete']
					});
				} catch {
					return false;
				}
			})
		);

		if (perms.every(Boolean)) deletable.push(u.id);
	}

	if (deletable.length === 0) return false;

	try {
		await db.delete(url).where(inArray(url.id, deletable));
		return true;
	} catch {
		return false;
	}
});

export const trySecret = form(
	v.object({
		_secret: v.pipe(v.string(m.errors_non_empty()), v.nonEmpty(m.errors_non_empty())),
		urlId: v.string()
	}),
	async ({ _secret, urlId }) => {
		const shortened = await db.query.url.findFirst({ where: { id: urlId } });
		if (!shortened) throw error(404, { message: m.errors_not_found() });
		const event = getRequestEvent();
		try {
			if (!shortened?.secret) {
				await logNotFound(event);
				throw error(400, { message: m.errors_generic() });
			}
			const res = await verifyPassword({ hash: shortened.secret, password: _secret });
			if (!res) {
				await logSecretNotValid(event);
				throw error(403, { message: m.errors_unauthorized() });
			}
		} catch (err) {
			if (CONSTANTS.DEBUG) console.error(err);
			throw err;
		}
		await logVisit(event, shortened);
		redirect(307, shortened.originalUrl);
	}
);
