import { m } from '$lib/paraglide/messages';
import * as v from 'valibot';
export const HostSchema = v.object({
	options: v.object({
		customRedirect: v.nullish(v.string(), '/dashboard'),
		disable: v.object({
			homepage: v.boolean(),
			limits: v.boolean(),
			lowerCaseFallback: v.optional(v.boolean()),
			signup: v.boolean(),
			twoFactor: v.boolean()
		}),
		limits: v.nullish(
			v.object({
				maxSnappPerUser: v.number(),
				requestsPerDay: v.number(),
				requestsPerMinute: v.number()
			})
		)
	}),
	origin: v.pipe(v.string(), v.nonEmpty(m.errors_non_empty()), v.url(m.errors_url_invalid())),
	thirdparty: v.nullish(
		v.object({
			umami: v.nullish(
				v.object({
					url: v.pipe(v.string(), v.url(m.errors_url_invalid())),
					websiteId: v.string()
				})
			),
			vtapi: v.nullish(
				v.object({
					apikey: v.string()
				})
			)
		})
	)
});
export type THost = v.InferOutput<typeof HostSchema>;

export const PermissionSchema = v.record(
			v.string(),
			v.array(
				v.union([
					v.literal('create'),
					v.literal('delete'),
					v.literal('update'),
					v.literal('read'),
					v.literal('cancel')
				])
			)
		);

export type TPermissions = v.InferOutput<typeof PermissionSchema>;