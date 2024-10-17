import { lucia } from '$lib/server/auth';
import { database } from '$lib/server/db/database.js';
import { fail, redirect } from '@sveltejs/kit';
import { decodeHex } from "oslo/encoding";
import { verifyTOTP } from "@oslojs/otp";
import { getServerSideSettings } from '$lib/server/server-wide-settings/index.js';

import { ENABLED_MFA } from '$lib/utils/constants';
import { getMFAThrottler } from '$lib/server/ratelimiter/mfa.throttler.js';
import crypto from 'node:crypto'
export const load = async ({ }) => {

	const settings = getServerSideSettings()
	if (settings.get(ENABLED_MFA) !== true) redirect(302, '/dashboard')
}

const hashInput = (input: string): string => {
	const hash = crypto.createHash('sha256');
	hash.update(input);
	return hash.digest('hex'); // Hex format of the hashed value
};

export const actions = {
	async default({ request, cookies, locals }) {
		const form = await request.formData();
		const otp = form.get('otp') as string | null;
		const sessionId = locals.session?.id
		if (!sessionId) return redirect(302, '/auth/sign-in')
		const { user } = await lucia.validateSession(sessionId);
		const ip = request.headers.get('x-forwarded-for')
		let hashedIp: string
		if (ip)
			hashedIp = hashInput(ip)
		else
			hashedIp = sessionId

		const throttler = getMFAThrottler()
		if (!throttler.consume(hashedIp)) {
			return fail(429, {
				message: 'errors.auth.too-many-requests-mfa',
				remaining_time: Math.ceil((throttler.getRemainingTime(hashedIp) || 0) / 60),
				short_code: null,
				success: false
			});
		}

		if (!user) return redirect(302, '/auth/sign-in')

		const [response] = await database.users.one(user.username)
		if (!response) redirect(302, '/auth/sign-in')
		const { two_factor_secret } = response
		if (otp && two_factor_secret) {
			const isValidOTP = verifyTOTP(decodeHex(two_factor_secret), 30, 6, otp)
			if (isValidOTP === false) return fail(400, {
				remaining_time: null,
				message: 'errors.auth.invalid-otp',
				success: false
			});
			await database.users.validate_otp(cookies, user, sessionId)
			throttler.reset(hashedIp)
			return { success: true }
		} else
			return fail(400, {
				remaining_time: null,
				message: 'errors.auth.invalid-otp',
				success: false
			});
	}
};
