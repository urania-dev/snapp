import { redirect } from '@sveltejs/kit';
import { m } from '$lib/paraglide/messages.js';
import { db } from '$lib/server/db/index.js';
import { apikey, url, user as userSchema, vtApiCache, watchlist } from '$lib/server/db/schema.js';
import {
	getAdminActivityLog,
	getOrgVisitorOrganizationStats,
	getUserActivityLog
} from '$lib/server/metrics/helpers.js';
import { error } from 'console';
import { and, count, eq, gt, isNotNull, isNull, lte, or } from 'drizzle-orm';

export const load = async ({ cookies, locals: { user }, parent }) => {
	if (!user) redirect(307, '/auth/sign-in');
	try {
		const now = new Date();

		await db
			.update(url)
			.set({ active: false, expiresAt: null })
			.where(and(isNotNull(url.expiresAt), lte(url.expiresAt, now)));

		const to = new Date(now);
		to.setHours(23, 59, 59, 999);

		const data = await parent();
		const from = new Date(to);
		from.setDate(to.getDate() - 7);
		from.setHours(0, 0, 0, 0);
		if (!data.activeOrganization) throw error(403, { message: m.errors_unrecognized_host() });
		const [activeURL] = await db
			.select({ count: count() })
			.from(url)
			.where(
				and(
					eq(url.organizationId, data.activeOrganization.id),
					user.role === 'user' ? eq(url.userId, user.id) : undefined,
					eq(url.active, true)
				)
			);
		const [disabledURL] = await db
			.select({ count: count() })
			.from(url)
			.where(
				and(
					eq(url.organizationId, data.activeOrganization!.id),
					user.role === 'user' ? eq(url.userId, user.id) : undefined,
					eq(url.active, false)
				)
			);

		const raw = await getOrgVisitorOrganizationStats({
			from,
			organizationId: data.activeOrganization!.id,
			to,
			user: {
				id: user.id,
				role: user.role ?? 'user'
			}
		});
		const [blacklistedDomains] = await db
			.select({ count: count() })
			.from(watchlist)
			.where(
				and(eq(watchlist.allowed, false), isNotNull(watchlist.domain), isNull(watchlist.username))
			);
		const [blacklistedUsername] = await db
			.select({ count: count() })
			.from(watchlist)
			.where(
				and(eq(watchlist.allowed, false), isNotNull(watchlist.username), isNull(watchlist.domain))
			);
		const [whitelistedDomains] = await db
			.select({ count: count() })
			.from(watchlist)
			.where(
				and(eq(watchlist.allowed, true), isNotNull(watchlist.domain), isNull(watchlist.username))
			);
		const [vtApiCached] = await db.select({ count: count() }).from(vtApiCache);

		const [apikeys] = await db
			.select({ count: count() })
			.from(apikey)
			.where(
				and(
					or(isNull(apikey.expiresAt), gt(apikey.expiresAt, now)),
					user.role === 'admin' ? undefined : eq(apikey.userId, user.id)
				)
			);
		const [blockedUrls] = await db
			.select({ count: count() })
			.from(url)
			.where(
				and(
					eq(url.organizationId, data.activeOrganization!.id),
					eq(url.status, 'blocked'),
					user.role === 'admin' ? undefined : eq(apikey.userId, user.id)
				)
			);

		const bannedUsers =
			user.role === 'admin'
				? await db
						.select({ count: count() })
						.from(userSchema)
						.where(and(eq(userSchema.banned, true)))
				: undefined;

		const limit = cookies.get('log-rows')?.toString();
		const payload = {
			activityLog:
				user?.role === 'admin'
					? await getAdminActivityLog(data.activeOrganization.id)
					: await getUserActivityLog(data.activeOrganization.id, user.id),
			from,
			kpis: {
				clicks: raw,
				url: {
					active: activeURL?.count ?? 0,
					disabled: disabledURL?.count ?? 0,
					total: (activeURL?.count ?? 0) + (disabledURL?.count ?? 0)
				}
			},
			limit: limit ? (isNaN(parseInt(limit)) ? 10 : parseInt(limit)) : 10,
			security: {
				apikeys: apikeys?.count ?? 0,
				domains: {
					blacklisted: blacklistedDomains?.count ?? 0,
					vtapi: vtApiCached?.count ?? 0,
					whitelisted: whitelistedDomains?.count ?? 0
				},
				urls: blockedUrls?.count ?? 0,
				users: {
					banned: bannedUsers?.[0]?.count ?? 0,
					username: blacklistedUsername?.count
				}
			},
			to,
			user
		};

		return payload
	} catch (err) {
		console.log(err);
		throw err;
	}
};
