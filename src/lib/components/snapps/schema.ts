import { z } from "zod";

export const snappSchema = z.object({
	expiresAt: z.string().optional(),
	groups: z.array(z.string()).default([]),
	maxUsages: z.number().default(0),
	notes: z.string().optional(),
	originalUrl: z.string().url("errors.snapps.original-url-missing"),
	secret: z.string().optional(),
	shortcode: z.string().optional(),
	tags: z.array(z.string()).default([]),
	utmParams: z.array(z.string()).default([])
});

export type SnappSchema = typeof snappSchema;

export const singleSchema = z.object({
	secret: z.string()
});
export type SingleSnappSchema = typeof singleSchema;
