import type { Cookies } from '@sveltejs/kit';

import { z } from 'zod';

export class ParamsHandler {
	private static limitSchema = z
		.string()
		.regex(/^\d+$/, 'Limit must be a number')
		.transform((val) => parseInt(val))
		.refine((num) => num > 0, { message: 'Limit must be greater than 0' })
		.optional();
	// Define Zod schemas
	private static paramSchema = z.object({
		group: z.string().optional(),
		page: z.string().regex(/^\d+$/, 'Page must be a number').optional().default('0'),
		query: z.string().optional(),
		sorting: z.string().optional(),
		tag: z.string().optional()
	});
	cookies: Cookies; // Replace with a proper cookie library type if using one.
	defaultLimit: number;

	expirationDays: number;

	url: URL;

	constructor(
		url: string,
		cookies: Cookies,
		defaultLimit: number = 10,
		expirationDays: number = 12
	) {
		this.url = new URL(url);
		this.cookies = cookies;
		this.defaultLimit = defaultLimit;
		this.expirationDays = expirationDays;
	}

	// Delete the limit cookie
	public deleteLimitCookie(): void {
		this.cookies.delete('limit', { path: '/' });
	}

	// Get and validate the limit (from search params or cookies, fallback to default)
	public getLimit(): number {
		const storedLimit = this.cookies.get('limit');
		const searchLimit = this.url.searchParams.get('limit');

		const parsedLimit = ParamsHandler.limitSchema.safeParse(searchLimit);
		if (parsedLimit.success) return parsedLimit.data || this.defaultLimit;

		const storedLimitParsed = ParamsHandler.limitSchema.safeParse(storedLimit);
		if (storedLimitParsed.success) {
			return storedLimitParsed.data || this.defaultLimit;
		}

		return this.defaultLimit;
	}

	// Parse and validate search parameters
	public getParams() {
		const searchParams = Object.fromEntries(this.url.searchParams.entries());
		return ParamsHandler.paramSchema.parse(searchParams);
	}

	// Save the limit to cookies only if it differs from the default value
	public saveLimit(limit: number): void {
		const currentLimitCookie = this.cookies.get('limit');
		if (limit === this.defaultLimit && currentLimitCookie) {
			this.deleteLimitCookie(); // Remove cookie if it matches the default
		} else if (limit.toString() !== currentLimitCookie) {
			const expirationDate = new Date(Date.now() + this.expirationDays * 24 * 60 * 60 * 1000);
			this.cookies.set('limit', limit.toString(), {
				expires: expirationDate,
				httpOnly: true,
				path: '/',
				secure: process.env.NODE_ENV !== 'development'
			});
		}
	}
}
