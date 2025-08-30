import { decodeHex, encodeHexLowerCase } from "@oslojs/encoding";
import { createTOTPKeyURI, verifyTOTP } from "@oslojs/otp";
import { fail, redirect } from "@sveltejs/kit";
import { otpSchema } from "$lib/components/auth/schema";
import { prisma } from "$lib/db/prisma";
import {
	createSession,
	generateSessionToken,
	invalidateSessions,
	setSessionTokenCookie
} from "$lib/server/auth";
import { getMFAThrottler } from "$lib/server/auth/throttler";
import { getSettings } from "$lib/server/config";
import crypto from "node:crypto";
import { superValidate } from "sveltekit-superforms";
import { zod } from "sveltekit-superforms/adapters";
import { renderSVG } from "uqr";

export const load = async (event) => {
	const settings = await getSettings();
	const userEnabledMFA =
		(
			await event.locals.prisma.setting.findFirst({
				where: { id: "ENABLED_MFA_" + event.locals.user?.id }
			})
		)?.value?.toLowerCase() === "true";
	const enabledMFA = settings.get("ENABLED_MFA") || userEnabledMFA;

	if (!event.locals.user || !event.locals.session || !enabledMFA) {
		redirect(302, "/auth/dashboard");
	}
	if (event.locals.user.tfs !== null) redirect(302, "/auth/mfa");

	const TOTPKey = new Uint8Array(20);
	crypto.getRandomValues(TOTPKey);

	const toptkeyEncrypted = encodeHexLowerCase(TOTPKey);
	const appname = settings.get<string>("APPNAME") || "SNAPP";
	const keyURI = createTOTPKeyURI(appname, event.locals.user.username, TOTPKey, 30, 6);

	const qrcode = renderSVG(keyURI);

	event.cookies.set("snappMfaTempSetup", `${toptkeyEncrypted}`, {
		expires: new Date(new Date().getTime() + 1000 * 60 * 60),
		httpOnly: true,
		path: "/",
		secure: process.env.NODE_ENV !== "development"
	});

	return {
		form: await superValidate(zod(otpSchema)),
		keyURI,
		qrcode,
		toptkeyEncrypted
	};
};

const hashInput = (input: string): string => {
	const hash = crypto.createHash("sha256");
	hash.update(input);
	return hash.digest("hex"); // Hex format of the hashed value
};

export const actions = {
	setTOTPKEY: async ({ cookies }) => {
		const setupMFA = cookies.get("snappMfaTempSetup")?.toString();
		if (setupMFA) {
			cookies.set("snappMFATemp", setupMFA, {
				expires: new Date(new Date().getTime() + 1000 * 60 * 60),
				httpOnly: true,
				path: "/",
				secure: process.env.NODE_ENV !== "development"
			});
		}

		return { set: true };
	},
	test: async (event) => {
		const { cookies, request } = event;
		const form = await superValidate(event, zod(otpSchema));
		if (!form.valid) {
			return fail(400, {
				form,
				set: true
			});
		}

		const sessionId = event.locals.session?.id;
		if (!sessionId) return redirect(302, "/auth/sign-in");
		const ip = request.headers.get("x-forwarded-for");
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

		const twoFactorSecret = cookies.get("snappMFATemp")?.toString();

		if (form.data.otp && twoFactorSecret) {
			const isValidOTP = verifyTOTP(decodeHex(twoFactorSecret), 30, 6, form.data.otp);
			if (isValidOTP === false) {
				return fail(400, {
					form,
					message: "errors.auth.invalid-otp",
					remainingTime: null,
					set: true,
					success: false
				});
			}

			await invalidateSessions(event.locals.user.id);
			const sessionId = generateSessionToken();
			const session = await createSession(sessionId, event.locals.user.id, true);
			setSessionTokenCookie(event, sessionId, session.expiresAt);
			throttler.reset(hashedIp);

			await prisma.user.update({
				data: { tfs: twoFactorSecret },
				where: { id: event.locals.user.id }
			});

			cookies.delete("snappMFATemp", { path: "/" });

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
