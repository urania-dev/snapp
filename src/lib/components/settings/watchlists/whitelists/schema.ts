import { z } from 'zod';

export const whiteListSchema = z.object({
	entity: z.string().trim().min(1, 'errors.generic')
});

export type WhiteListSchema = typeof whiteListSchema;
