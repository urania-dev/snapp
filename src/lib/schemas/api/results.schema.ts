import { url } from "$lib/server/db/schema";
import { createSelectSchema } from 'drizzle-valibot';
import * as v from 'valibot'

export const UrlSchema = createSelectSchema(url);
export const UrlListResponseSchema = v.object({
  _count: v.number(),
  _limit: v.number(),
  urls: v.array(v.object({...UrlSchema.entries, secret:v.boolean()}))
});
