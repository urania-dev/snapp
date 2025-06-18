import type { Handle } from '@sveltejs/kit';

import { RetryAfterRateLimiter } from 'sveltekit-rate-limiter/server';

import { getSettings } from '../config';
import { CustomRateLimiter } from './rateLimiter';

let requestsPerMinute = new CustomRateLimiter([100, 'm']); // Default config
let requestsPerDays = new CustomRateLimiter([144000, 'd']); // Default config

const rate = {
	limiter: new RetryAfterRateLimiter({
		plugins: [requestsPerMinute, requestsPerDays]
	})
};

export async function updateLimiterConfigPerDay() {
	const settings = await getSettings();
	const requests = settings.get<number>('RPD_REQUESTS') || 144000; // Default 100
	requestsPerDays = new CustomRateLimiter([requests, 'd']);
	rate.limiter = new RetryAfterRateLimiter({
		plugins: [requestsPerMinute, requestsPerDays]
	});
}
export async function updateLimiterConfigPerMinute() {
	const settings = await getSettings();
	const requests = settings.get<number>('RPM_REQUESTS') || 100; // Default 100
	requestsPerMinute = new CustomRateLimiter([requests, 'm']);
	rate.limiter = new RetryAfterRateLimiter({
		plugins: [requestsPerMinute]
	});
}

export const handleRateLimits: Handle = async ({ event, resolve }) => {
	const settings = await getSettings();
	const LIMITS_ARE_ENABLED = settings.get<boolean>('ENABLE_LIMITS');
	if (!LIMITS_ARE_ENABLED) return resolve(event);

	const status = await rate.limiter.check(event);
	if (status.limited) {
		const response = new Response(
			`You are being rate limited. Please try after ${status.retryAfter} seconds.`,
			{
				headers: { 'Retry-After': status.retryAfter.toString() },
				status: 429
			}
		);
		return response;
	}

	return resolve(event);
};
