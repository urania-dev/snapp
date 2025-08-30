import { z } from "zod";

export const groupSchema = z.object({
	name: z.string(),
	notes: z.string().optional(),
	slug: z.string()
});

export type GroupSchema = typeof groupSchema;
