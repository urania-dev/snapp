import { redirect } from '@sveltejs/kit';
import { m } from '$lib/paraglide/messages.js';
import { vtapiValidity } from '$lib/remotes/vtapi.remote';
import { CONSTANTS } from '$lib/server/const.js';
import { db } from '$lib/server/db/index.js';
import { url } from '$lib/server/db/schema.js';
import { logNotFound, logVisit } from '$lib/server/umami';
import { domainFromUrl } from '$lib/utils.js';
import { error } from 'console';
import { and, asc, eq, isNotNull, lte, sql } from 'drizzle-orm';

export const load = async (event) => {
	const {
		locals: { user },
		params: { shortcode }
	} = event;

	const data = await event.parent();

	const [shortened] = await db.transaction(async (tx) => {
		await tx
			.update(url)
			.set({ active: false, expiresAt: null })
			.where(and(isNotNull(url.expiresAt), lte(url.expiresAt, new Date())));
		if (!data.activeOrganization) return [];
		const orgSpecific = await tx
			.select()
			.from(url)
			.where(
				and(
					eq(url.active, true),
					eq(url.shortcode, shortcode),
					eq(url.organizationId, data.activeOrganization.id)
				)
			)
			.limit(1);

		if (orgSpecific.length > 0) return orgSpecific;
		const lowerCaseFallback =
			data.host.options.disable.lowerCaseFallback === true
				? []
				: await tx
					.select()
					.from(url)
					.where(
						and(
							eq(url.active, true),
							eq(url.organizationId, data.activeOrganization.id),
						   sql`lower(${url.shortcode}) = lower(${shortcode})`
						)
					)
					.limit(1);

		if (lowerCaseFallback.length > 0) return lowerCaseFallback;
		const fallback = await tx
			.select()
			.from(url)
			.where(and(eq(url.active, true), eq(url.shortcode, shortcode)))
			.orderBy(asc(url.createdAt))
			.limit(1);

		return fallback;
	});

	if (!shortened || shortened.active === false) {
		await logNotFound(event);
		return { disabled: true, snappHasSecret: false };
	}

	const redirection = new URL(shortened.originalUrl);

	for (const params of Object.values(shortened.utm || {}))
		redirection.searchParams.set(params.key, params.value);

	const domain = domainFromUrl(redirection.href);
	const blacklisted = await db.query.watchlist.findFirst({
		where: {
			allowed: false,
			domain,
			username: { isNull: true }
		}
	});
	try {
		const validForAPI = await vtapiValidity(domain);
		if (!validForAPI || blacklisted) throw error(403, { message: m.errors_blacklisted_url() });

		if (shortened.secret === null) {
			if (shortened.userId !== user?.id) await logVisit(event, shortened);
		} else return { disabled: false, snappHasSecret: true, urlId: shortened.id };
	} catch (err) {
		if (CONSTANTS.DEBUG) console.error(err);
	}
	redirect(307, encodeURI(decodeURI(redirection.href)));
};
