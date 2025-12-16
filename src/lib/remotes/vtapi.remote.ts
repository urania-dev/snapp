import { error } from '@sveltejs/kit';
import { getRequestEvent, query } from '$app/server';
import { m } from '$lib/paraglide/messages';
import { CONSTANTS } from '$lib/server/const';
import { db } from '$lib/server/db';
import { url, vtApiCache, watchlist } from '$lib/server/db/schema';
import { generateId } from 'better-auth';
import { lt, sql } from 'drizzle-orm';
import * as v from 'valibot';

import { getHost } from './config.remote';

export const getFreshVTAPI = query(
	v.object({
		_apikey: v.string(),
		website: v.pipe(v.string(m.errors_non_empty()), v.url(m.errors_url_invalid()))
	}),
	async ({ _apikey, website }) => {
		const { fetch } = getRequestEvent();

		const encodedParams = new URLSearchParams();
		encodedParams.set('url', website);
		const _url = 'https://www.virustotal.com/api/v3/urls';
		const _options = {
			body: encodedParams,
			headers: {
				accept: 'application/json',
				'content-type': 'application/x-www-form-urlencoded',
				'x-apikey': _apikey
			},
			method: 'POST'
		};
		const res = await (await fetch(_url, _options)).json();

		const analysis = await (
			await fetch(res.data.links.self, {
				headers: {
					'x-apikey': _apikey
				}
			})
		).json();
		if (CONSTANTS.DEBUG) console.info(analysis.data.attributes.stats);
		return analysis.data.attributes.stats;
	}
);
export const vtapiValidity = query(
	v.pipe(v.string(m.errors_non_empty()), v.url(m.errors_url_invalid())),
	async (website) => {
		const aMonthAgo = new Date();
		aMonthAgo.setMonth(new Date().getMonth() - 1);

		const host = await getHost();
		const vtApiKey = host.thirdparty?.vtapi?.apikey;
		if (!vtApiKey) return true;

		try {
			await db.delete(vtApiCache).where(lt(vtApiCache.createdAt, aMonthAgo));
			const cached = await db.query.vtApiCache.findFirst({
				where: { domain: website }
			});

			const response = cached?.result
				? JSON.parse(cached.result)
				: await getFreshVTAPI({ _apikey: vtApiKey, website });

			if (!cached)
				await db.insert(vtApiCache).values({
					domain: website,
					result: JSON.stringify(response)
				});

			const is_clean = response.malicious === 0;
			if (is_clean) return is_clean;
			else {
				const res = await db.transaction(async (tx) => {
					try {
						const escaped = website.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

						const regex = `^${escaped}`;

						await tx
							.update(url)
							.set({ active: false, status: 'blocked' })
							.where(sql`${url.originalUrl} ~* ${regex}`);

						await tx.insert(watchlist).values({
							allowed: false,
							createdAt: new Date(),
							domain: website,
							id: generateId(8),
							username: null
						});
					} catch (err) {
						if (CONSTANTS.DEBUG) console.error(err);

						return { error: true };
					}
				});
				if (res?.error) {
					throw error(400, { message: m.errors_generic() });
				}
			}
		} catch (error) {
			if (CONSTANTS.DEBUG) console.error(error);
			return true;
		}
	}
);
