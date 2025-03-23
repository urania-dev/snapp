import { z } from 'zod';

export const tagSchema = z.object({
	name: z.string(),
	notes: z.string().optional(),
	slug: z.string()
});

export type TagSchema = typeof tagSchema;
