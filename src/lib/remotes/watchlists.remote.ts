import { redirect } from '@sveltejs/kit';
import { command, query } from '$app/server';
import { PaginationSchema } from '$lib/schemas/pagination.schema';
import { WatchlistSchema } from '$lib/schemas/watchlists.schema';
import { CONSTANTS } from '$lib/server/const';
import { db } from '$lib/server/db';
import { url, watchlist } from '$lib/server/db/schema';
import { inArray, sql } from 'drizzle-orm';
import * as v from 'valibot';

import { requireUser } from './auth.remote';

export const getUsernameWhitelist = query(PaginationSchema, async (pagination) => {
	const user = await requireUser();
	if (user.role !== 'admin') {
		if (CONSTANTS.DEBUG) console.log('[auth] redirect not admin');
		redirect(307, '/dashboard');
	}
	const { limit = 10, page = 1 } = pagination || { limit: 10, page: 1 };
	const offset = (page! - 1) * limit!;
	const list = await db.query.watchlist.findMany({
		limit,
		offset,
		where: {
			allowed: true,
			domain: { isNull: true },
			username: { isNotNull: true }
		}
	});
	return list;
});
export const getDomainWhitelist = query(PaginationSchema, async (pagination) => {
	const user = await requireUser();
	if (user.role !== 'admin') {
		if (CONSTANTS.DEBUG) console.log('[auth] redirect not admin');
		redirect(307, '/dashboard');
	}

	const { limit = 10, page = 1 } = pagination || { limit: 10, page: 1 };
	const offset = (page! - 1) * limit!;
	const list = await db.query.watchlist.findMany({
		limit,
		offset,
		where: {
			allowed: true,
			domain: { isNotNull: true },
			username: { isNull: true }
		}
	});
	return list;
});
export const getEmailWhitelist = query(PaginationSchema, async (pagination) => {
	const user = await requireUser();
	if (user.role !== 'admin') {
		if (CONSTANTS.DEBUG) console.log('[auth] redirect not admin');
		redirect(307, '/dashboard');
	}
	const { limit = 10, page = 1 } = pagination || { limit: 10, page: 1 };
	const offset = (page! - 1) * limit!;
	const list = await db.query.watchlist.findMany({
		limit,
		offset,
		where: {
			allowed: true,
			domain: { isNotNull: true },
			username: { isNotNull: true }
		}
	});
	return list;
});
export const getUsernameBlacklist = query(PaginationSchema, async (pagination) => {
	const user = await requireUser();
	if (user.role !== 'admin') {
		if (CONSTANTS.DEBUG) console.log('[auth] redirect not admin');
		redirect(307, '/dashboard');
	}
	const { limit = 10, page = 1 } = pagination || { limit: 10, page: 1 };
	const offset = (page! - 1) * limit!;
	const list = await db.query.watchlist.findMany({
		limit,
		offset,
		where: {
			allowed: false,
			domain: { isNull: true },
			username: { isNotNull: true }
		}
	});
	return list;
});
export const getDomainBlacklist = query(PaginationSchema, async (pagination) => {
	const user = await requireUser();
	if (user.role !== 'admin') {
		if (CONSTANTS.DEBUG) console.log('[auth] redirect not admin');
		redirect(307, '/dashboard');
	}
	const { limit = 10, page = 1 } = pagination || { limit: 10, page: 1 };
	const offset = (page! - 1) * limit!;
	const list = await db.query.watchlist.findMany({
		limit,
		offset,
		where: {
			allowed: false,
			domain: { isNotNull: true },
			username: { isNull: true }
		}
	});
	return list;
});
export const getEmailBlacklist = query(PaginationSchema, async (pagination) => {
	const user = await requireUser();
	if (user.role !== 'admin') {
		if (CONSTANTS.DEBUG) console.log('[auth] redirect not admin');
		redirect(307, '/dashboard');
	}
	const { limit = 10, page = 1 } = pagination || { limit: 10, page: 1 };
	const offset = (page! - 1) * limit!;

	const list = await db.query.watchlist.findMany({
		limit,
		offset,
		where: {
			allowed: false,
			domain: { isNotNull: true },
			username: { isNotNull: true }
		}
	});
	return list;
});
export const addToWatchlist = command(v.omit(WatchlistSchema, ['createdAt']), async (w) => {
	try {
		await db.insert(watchlist).values(w);
	} catch (error) {
		if (CONSTANTS.DEBUG) console.error('[watchlist] add to watchlist', error);
		return { success: false };
	}
	return { success: true };
});
export const deleteFromWatchlist = command(v.array(v.string()), async (ids) => {
  try {
    await db.transaction(async (tx) => {
      const deleted = await tx
        .delete(watchlist)
        .where(inArray(watchlist.id, ids))
        .returning();

      await Promise.all(
        deleted.map(async (d) => {
          if (d.username === null && d.domain && d.allowed === false) {
            const escaped = d.domain.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

            const regex = `^https?://([^/]*\\.)?${escaped}(/|$)`;

            await tx
              .update(url)
              .set({ status: "clean" })
              .where(sql`${url.originalUrl} ~* ${regex}`);

          }
        })
      );
    });

	} catch (error) {
		return { message: (error as Error)?.message, success: false };
	}
	return { success: true };
});
