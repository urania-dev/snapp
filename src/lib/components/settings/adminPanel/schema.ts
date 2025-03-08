import { z } from 'zod';

export const umamiSchema = z.object({
	url: z.string().url().optional().nullable(),
	websiteId: z.string().uuid().optional().nullable()
});

export type UmamiSchema = typeof umamiSchema;

export const vtAPISchema = z.object({
	secret: z.string().optional()
});
export type VtAPISchema = typeof vtAPISchema;
