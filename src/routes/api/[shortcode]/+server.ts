import { redirect } from '@sveltejs/kit';
import {defineEndpoint} from '@uraniadev/sveltekit-valibot-openapi'
import { m } from '$lib/paraglide/messages.js';
import { vtapiValidity } from '$lib/remotes/vtapi.remote';
import { authenticateAPI } from '$lib/server/api/authenticate';
import { CONSTANTS } from '$lib/server/const.js';
import { db } from '$lib/server/db/index.js';
import { url } from '$lib/server/db/schema.js';
import { logNotFound, logVisit } from '$lib/server/umami';
import { domainFromUrl } from '$lib/utils.js';
import { verifyPassword } from 'better-auth/crypto';
import { error } from 'console';
import { and, asc, eq, isNotNull, lte, sql } from 'drizzle-orm';
import * as v from 'valibot'

const SecretSchema = v.object({_secret:v.optional(v.string())})
export const POST = async (event) => {
		const { host, key,organizationId } = await authenticateAPI();

		const body = await event.request.json()
		const secret = v.safeParse(SecretSchema,body)
		const user = await db.query.user.findFirst({
			columns: { id: true, role: true },
			where: { id: key.userId }
		});
		if (!user) throw error(401, { message: m.errors_unauthorized() });

	

	const [shortened] = await db.transaction(async (tx) => {
		await tx
			.update(url)
			.set({ active: false, expiresAt: null })
			.where(and(isNotNull(url.expiresAt), lte(url.expiresAt, new Date())));
		if (!organizationId) return [];
		const orgSpecific = await tx
			.select()
			.from(url)
			.where(
				and(
					eq(url.active, true),
					eq(url.shortcode, event.params.shortcode),
					eq(url.organizationId, organizationId)
				)
			)
			.limit(1);

		if (orgSpecific.length > 0) return orgSpecific;
		const lowerCaseFallback =
			host.options.disable.lowerCaseFallback === true
				? []
				: await tx
					.select()
					.from(url)
					.where(
						and(
							eq(url.active, true),
							eq(url.organizationId, organizationId),
						   sql`lower(${url.shortcode}) = lower(${event.params.shortcode})`
						)
					)
					.limit(1);

		if (lowerCaseFallback.length > 0) return lowerCaseFallback;
		const fallback = await tx
			.select()
			.from(url)
			.where(and(eq(url.active, true), eq(url.shortcode, event.params.shortcode)))
			.orderBy(asc(url.createdAt))
			.limit(1);

		return fallback;
	});

	if (!shortened || shortened.active === false) {
		await logNotFound(event);
		throw error(404, {message: m.disabled_urls()})
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
		} else {
			if(!secret.success)throw error(401, {message: m.api_url_protected()})
			const valid = secret.output._secret && await verifyPassword({hash:shortened.secret,password:secret.output._secret}) || false
			if(!valid) throw error(403, {message: m.api_url_protected()})
		}
	} catch (err) {
		if (CONSTANTS.DEBUG) console.error(err);
	}
	redirect(307, encodeURI(decodeURI(redirection.href)));
};

export const _openapi = {
	POST: defineEndpoint({
		body: {
			content: {
				'application/json': SecretSchema
			},
			description: m.api_url_resolve_body_description(),
			required: false
		},
		description: m.api_url_resolve_description(),
		method: 'POST',
		responses: {
			307: {
				description: m.api_url_resolve_redirect()
			},
			401: {
				description: m.errors_unauthorized()
			},
			403: {
				description: m.api_url_protected()
			},
			404: {
				description: m.disabled_urls()
			},
			500: {
				description: m.errors_generic()
			}
		},
		summary: m.api_url_resolve_summary(),
		tags: ['URLs']
	})
} as const;