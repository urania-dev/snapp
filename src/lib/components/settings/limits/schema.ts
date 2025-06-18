import { z } from 'zod';

export const rateSchema = z.object({
	rpd: z.string().optional(),
	rpm: z.string().optional(),
	spu: z.string().optional()
});
export type RateSchema = typeof rateSchema;
