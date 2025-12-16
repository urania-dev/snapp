import * as v from 'valibot';
export const WatchlistSchema = v.object({
	allowed: v.boolean(),
	createdAt: v.date(),
	domain: v.nullable(v.string()),
	id: v.string(),
	username: v.nullable(v.string())
});
export const WhitelistUsernameSchema = v.object({
	...v.omit(WatchlistSchema, ['allowed', 'domain', 'username']).entries,
	allowed: v.literal(true),
	domain: v.null(),
	username: v.string()
});
export const WhitelistDomainSchema = v.object({
	...v.omit(WatchlistSchema, ['allowed', 'domain', 'username']).entries,
	allowed: v.literal(true),
	domain: v.string(),
	username: v.null()
});
export const WhitelistEmailSchema = v.object({
	...v.omit(WatchlistSchema, ['allowed', 'domain', 'username']).entries,
	allowed: v.literal(true),
	domain: v.string(),
	username: v.string()
});
export type Watchlist = v.InferOutput<typeof WatchlistSchema>;
export type WatchlistInput = v.InferInput<typeof WatchlistSchema>;
