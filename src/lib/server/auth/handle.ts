import { type Handle, redirect } from "@sveltejs/kit";
import { enhance } from "@zenstackhq/runtime";
import { prisma } from "$lib/db/prisma";

import { validateSessionToken } from ".";
import { getSettings } from "../config";

export const authHandle: Handle = async ({ event, resolve }) => {
	const settings = await getSettings();
	const sessionId = event.cookies.get("auth");

	const DATABASE_OFFLINE = settings.get<boolean>("DB_OFFLINE");
	switch (true) {
		case DATABASE_OFFLINE && event.url.pathname !== "/db-error":
			return redirect(302, "/db-error");
		case !DATABASE_OFFLINE && event.url.pathname === "/db-error":
			return resolve(event);
		default:
			break;
	}

	if (
		(DATABASE_OFFLINE === null || DATABASE_OFFLINE === false) &&
		event.url.pathname === "/db-error"
	)
		redirect(302, "/");

	if (!sessionId) {
		event.locals.user = null;
		event.locals.session = null;
		event.locals.prisma = enhance(prisma, { user: undefined });
		return resolve(event);
	}

	const { session, user } = await validateSessionToken(sessionId);
	if (!user) {
		event.locals.user = null;
		event.locals.session = null;
		event.locals.prisma = enhance(prisma, { user: undefined });

		return resolve(event);
	}
	if (user && user.verified === false && !["/auth/verify-email"].includes(event.url.pathname)) {
		redirect(302, "/auth/verify-email");
	}

	const isMFAUserEnabled = await prisma.setting.findFirst({
		where: { id: "ENABLED_MFA_" + user.id }
	});

	const isMFAEnabled =
		settings.get<boolean>("ENABLED_MFA") === true ||
		isMFAUserEnabled?.value?.toLowerCase() === "true";
	const isUserConfigured = user && typeof user.tfs === "string";
	if (
		isMFAEnabled === true &&
		!isUserConfigured &&
		!["/", "/auth/mfa/setup", "/auth/verify-email"].includes(event.url.pathname)
	) {
		redirect(302, "/auth/mfa/setup");
	}

	if (
		isMFAEnabled === true &&
		isUserConfigured &&
		!session.tfs &&
		!["/", "/auth/mfa", "/auth/verify-email"].includes(event.url.pathname)
	) {
		redirect(302, "/auth/mfa");
	}

	event.locals.session = session;
	event.locals.user = user;
	event.locals.prisma = enhance(prisma, { user });
	return resolve(event);
};
