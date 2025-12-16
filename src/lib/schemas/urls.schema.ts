import { getRequestEvent } from '$app/server';
import { m } from '$lib/paraglide/messages';
import { getHost } from '$lib/remotes/config.remote';
import { db } from '$lib/server/db';
import { tag, team, url } from '$lib/server/db/schema';
import { slugify } from '$lib/utils';
import { createInsertSchema, createSelectSchema } from 'drizzle-valibot';
import * as v from 'valibot'

const CreateURLPayloadSchema =  v.objectAsync({
        _secret: v.optional(v.string()),
        expiresAt: v.pipe(
            v.optional(v.string()),
            v.transform((i) => (i ? parseInt(i) : undefined))
        ),
        limit: v.pipe(
            v.optional(v.string(), '-1'),
            v.transform((i) => parseInt(i))
        ),
        notes: v.optional(v.string()),
        originalUrl: v.pipe(v.string(m.errors_non_empty()), v.url(m.errors_url_invalid())),
        shortcode: v.pipeAsync(
            v.optional(v.string()),
            v.checkAsync(async (shrt) => {
                if (!shrt) return true;
                const host = await getHost();
                const organizationId = slugify(host.origin);
                const exists = await db.query.url.findFirst({
                    where: { organizationId, shortcode: shrt }
                });
                if (!exists) return true;
                else return false;
            }, m.errors_shortcode_used())
        ),
        tags: v.pipe(
            v.optional(v.string(),"[]"),
            v.transform((s) => JSON.parse(s) as string[])
        ),
        teams: v.pipe(
            v.optional(v.string(),"[]"),
            v.transform((s) => JSON.parse(s) as string[])
        ),
        utms: v.pipe(
            v.optional(v.string(),"[]"),
        )
    })

export const CreateURLSchema = v.pipeAsync(
   CreateURLPayloadSchema,
    v.transform((input)=>({...input, utms:JSON.parse(input.utms) as { key: string; name: string; value: string }[]}))
);

export const PostURLSchema = v.pipeAsync(
   v.omit(CreateURLPayloadSchema,['tags','teams']),
   v.transform((input)=>({...input, utms:JSON.parse(input.utms) as { key: string; name: string; value: string }[]}))
);

export const UpdateURLPayloadSchema =  v.objectAsync({
        _secret: v.optional(v.string()),
        expiresAt: v.pipe(
            v.optional(v.string()),
            v.transform((i) => (i ? parseInt(i) : undefined))
        ),
        limit: v.pipe(
            v.optional(v.string(), '-1'),
            v.transform((i) => parseInt(i))
        ),
        notes: v.optional(v.string()),
        originalUrl: v.optional(v.pipe(v.string(), v.url(m.errors_url_invalid()))),
        removeExpiration: v.pipe(
            v.optional(v.string(), 'false'),
            v.transform((i) => i === 'true')
        ),
        removeSecret: v.pipe(
            v.optional(v.string(), 'false'),
            v.transform((i) => i === 'true')
        ),
        shortcode: v.pipe(v.optional(v.string())),
         tags: v.pipe(
            v.optional(v.string(),"[]"),
            v.transform((s) => JSON.parse(s) as string[])
        ),
        teams: v.pipe(
            v.optional(v.string(),"[]"),
            v.transform((s) => JSON.parse(s) as string[])
        ),
        utms: v.pipe(
            v.optional(v.string(),"[]"),
        )
    })

export const UpdateURLSchema = v.pipeAsync(
   UpdateURLPayloadSchema,
    v.checkAsync(async (input) => {
        if (!input.shortcode) return true;
        const host = await getHost();
        const organizationId = slugify(host.origin);
        const {
            params: { id }
        } = getRequestEvent();
        if (!id) return false;
        const exists = await db.query.url.findFirst({
            where: { NOT: { id }, organizationId, shortcode: input.shortcode }
        });
        if (!exists) return true;
        else return false;
    }, m.errors_shortcode_used()),
    v.transform((input)=>({...input, utms:JSON.parse(input.utms) as { key: string; name: string; value: string }[]}))
);

export const PatchURLSchema =  v.pipeAsync(
   v.omit(UpdateURLPayloadSchema,['tags','teams']),
    v.checkAsync(async (input) => {
        if (!input.shortcode) return true;
        const host = await getHost();
        const organizationId = slugify(host.origin);
        const {
            params: { id }
        } = getRequestEvent();
        if (!id) return false;
        const exists = await db.query.url.findFirst({
            where: { NOT: { id }, organizationId, shortcode: input.shortcode }
        });
        if (!exists) return true;
        else return false;
    }, m.errors_shortcode_used()),
    v.transform((input)=>({...input, utms:JSON.parse(input.utms) as { key: string; name: string; value: string }[]}))
);

export const TagRecordSchema = createSelectSchema(tag)
export const TeamRecordSchema = createSelectSchema(team,{
    createdAt:v.date()
})
export const URLRecordSchema = createInsertSchema(url,{
    createdAt:v.optional(v.date())
})

export const URLWithTagAndTeamSchema = v.object({
    ...URLRecordSchema.entries,
    tags: v.array(TagRecordSchema),
    teams: v.array(TeamRecordSchema),
})
export const URLWithTagSchema = v.object({
    ...URLRecordSchema.entries,
    tags: v.array(TagRecordSchema),
})
export const URLWithTeamSchema = v.object({
    ...URLRecordSchema.entries,
    teams: v.array(TeamRecordSchema),
})

export const URLListResponseSchema = v.object({
  _count: v.number(),
  _limit: v.number(),
  _offset: v.number(),
  urls: v.array(v.object({
      ...URLRecordSchema.entries,
      tags: v.optional(v.array(TagRecordSchema)),
      teams:v.optional( v.array(TeamRecordSchema)),
    })
  )
});
