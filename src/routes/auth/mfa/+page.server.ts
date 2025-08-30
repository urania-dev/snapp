import { decodeHex } from "@oslojs/encoding";
import { verifyTOTP } from "@oslojs/otp";
import { fail, redirect } from "@sveltejs/kit";
import { otpSchema } from "$lib/components/auth/schema";
import {
	createSession,
	generateSessionToken,
	invalidateSessions,
	setSessionTokenCookie
} from "$lib/server/auth/index.js";
import { getMFAThrottler } from "$lib/server/auth/throttler.js";
import { getSettings } from "$lib/server/config/index.js";
import crypto from "node:crypto";
import { superValidate } from "sveltekit-superforms";
import { zod } from "sveltekit-superforms/adapters";
export const load = async ({ locals: { prisma, user } }) => {
	const userEnabledMFA =
		(user &&
			(
				await prisma.setting.findFirst({
					where: { id: "ENABLED_MFA_" + user?.id }
				})
			)?.value?.toLowerCase() === "true") ||
		false;
	const settings = await getSettings();
	if (settings.get("ENABLED_MFA") !== true && userEnabledMFA !== true) {
		redirect(302, "/dashboard");
	}
	return {
		form: await superValidate(zod(otpSchema))
	};
};

const hashInput = (input: string): string => {
	const hash = crypto.createHash("sha256");
	hash.update(input);
	return hash.digest("hex"); // Hex format of the hashed value
};

export const actions = {
	test: async (event) => {
		const form = await superValidate(event, zod(otpSchema));
		if (!form.valid) {
			return fail(400, {
				form,
				set: true
			});
		}

		const sessionId = event.locals.session?.id;
		if (!sessionId) return redirect(302, "/auth/sign-in");
		const ip = event.request.headers.get("x-forwarded-for");
		let hashedIp: string;
		if (ip) {
			hashedIp = hashInput(ip);
		} else {
			hashedIp = sessionId;
		}

		const throttler = getMFAThrottler();
		if (!throttler.consume(hashedIp)) {
			return fail(429, {
				form,
				message: "errors.auth.too-many-requests-mfa",
				remainingTime: Math.ceil((throttler.getRemainingTime(hashedIp) || 0) / 60),
				set: true,
				success: false
			});
		}
		if (!event.locals.user) return redirect(302, "/auth/sign-in");

		if (form.data.otp && event.locals.user.tfs) {
			const isValidOTP = verifyTOTP(decodeHex(event.locals.user.tfs), 30, 6, form.data.otp);
			if (isValidOTP === false) {
				return fail(400, {
					form,
					message: "errors.auth.invalid-otp",
					remainingTime: null,
					success: false
				});
			}

			await invalidateSessions(event.locals.user.id);
			const sessionId = generateSessionToken();
			const session = await createSession(sessionId, event.locals.user.id, true);
			setSessionTokenCookie(event, sessionId, session.expiresAt);
			throttler.reset(hashedIp);

			redirect(302, "/dashboard");
		} else {
			return fail(400, {
				form,
				message: "errors.auth.invalid-otp",
				remainingTime: null,
				set: true,
				success: false
			});
		}
	}
};
