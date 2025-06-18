import { z } from 'zod';

export const blackListSchema = z.object({
	entity: z.string().trim().min(1, 'errors.generic')
});

export type BlackListSchema = typeof blackListSchema;
