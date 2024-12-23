import { database } from "$lib/server/db/database.js";
import { prisma } from "$lib/server/prisma";
import {
	ALLOW_UNSECURE_HTTP,
	MAX_SNAPPS_PER_USER,
	SNAPP_ORIGIN_URL_BLACKLISTED,
	SNAPP_ORIGIN_URL_REQUESTED,
	TAGS_AS_PREFIX,
	UNAUTHORIZED,
} from "$lib/utils/constants.js";
import { fail, redirect } from "@sveltejs/kit";

export const load = async (
	{ locals: { session, user }, url, params: { username, id } },
) => {
	if (!session || !user) redirect(302, "/auth/sign-in");
	if (!id) redirect(302, "/users/" + username);

	const [exists] = await database.users.one(username);
	if (exists === null) redirect(302, "/users");
	const is_admin = await database.users.is_admin(user.id);
	if (!is_admin) redirect(302, "/");
	const startString = url.searchParams.get("start")?.toString() || undefined;
	const endString = url.searchParams.get("end")?.toString() || undefined;
	const [snapp, err] = await database.snapps.id(id);
	if (!snapp) redirect(302, "/users/" + username);
	const start = startString ? new Date(startString) : new Date();
	const end = endString ? new Date(endString) : new Date();

	if (!startString || !endString) {
		start.setTime(end.getTime() - 7 * 24 * 60 * 60 * 1000);
	}

	if (!snapp || err) redirect(302, "/users/" + username);
	const metrics = await getTimelineValue(snapp.id, start, end);
	const totalVisits = await prisma.usages.count({
		where: { snappId: snapp.id },
	});

	return { snapp, metrics, start, end, username, totalVisits };
};

export const actions = {
	disable: async (
		{ locals: { session }, request, params: { id }, fetch },
	) => {
		if (!session) redirect(302, "/");

		const form = await request.formData();
		const disabled =
			form.get("disabled")?.toString()?.toLowerCase() === "true" || false;
		const [snapp, err] = await database.snapps.id(id);
		if (!snapp || err) {
			const message = "errors.snapps.snapp-not-found";
			return fail(400, { message });
		}
		snapp.disabled = disabled;

		const [, err2] = await database.snapps.edit(
			{
				...snapp,
				tags: snapp.tags.map((t) => t.slug),
			},
			snapp?.userId,
			fetch,
		);

		let message: string | undefined = undefined;
		if (err2 === TAGS_AS_PREFIX) {
			message = "This Snapps has no prefix selected, please include one.";
		}
		if (err2 === MAX_SNAPPS_PER_USER) message = "errors.snapps.max-snapps";
		if (err2 === SNAPP_ORIGIN_URL_REQUESTED) {
			message = "errors.snapps.original-url-missing";
		}
		if (err2 === SNAPP_ORIGIN_URL_BLACKLISTED) {
			message = "errors.snapps.original-url-blacklisted";
		}
		if (err2 === UNAUTHORIZED) message = "errors.unauthorized";
		if (err2 === ALLOW_UNSECURE_HTTP) {
			message = "errors.snapps.unallowed-not-https";
		}
		if (message) return fail(400, { message });
		return { message: "snapps.actions.edited" };
	},
};

const getTimelineValue = async (snappId: string, start: Date, end: Date) => {
	end.setHours(24, 59, 59, 9999);
	const mapped = new Map<string, number>();
	const values = await prisma.usages
		.findMany({
			where: {
				snappId: snappId,
				AND: [{ timestamp: { lte: end } }, { timestamp: { gte: start } }],
			},
			select: { timestamp: true },
		})
		.then((res) => res.map((t) => t.timestamp.toISOString().split("T")[0]));

	for (const idx in values) {
		if (mapped.has(values[idx])) {
			mapped.set(values[idx], mapped.get(values[idx])! + 1);
		} else mapped.set(values[idx], 1);
	}

	return Object.fromEntries(mapped);
};
