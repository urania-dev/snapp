import type { RequestEvent } from "@sveltejs/kit";
import type { Rate, RateLimiterPlugin } from "sveltekit-rate-limiter/server";

export class CustomRateLimiter implements RateLimiterPlugin {
	readonly rate: Rate | Rate[];

	constructor(rate: Rate | Rate[]) {
		this.rate = rate;
	}

	hash = async (event: RequestEvent): Promise<boolean | null | string> => {
		if (event.locals.user && ["admin", "root"].includes(event.locals.user.role)) return true;

		const idOrApiKey =
			event.locals.user?.id || event.request.headers.get("Authorization")?.split("Bearer ")?.[1];
		if (idOrApiKey) return idOrApiKey;

		const clientIP = event.request.headers.get("x-forwarded-for")?.split(",")[0];
		return clientIP || event.getClientAddress() || false;
	};
}
