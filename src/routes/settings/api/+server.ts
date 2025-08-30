import { error, json, redirect } from "@sveltejs/kit";
import { getSettings } from "$lib/server/config/index.js";

export const GET = async ({ locals: { user } }) => {
	if (!user) redirect(302, "/dashboard");
	const settings = await getSettings();
	const parsed = settings.list();
	if (user.role === "user") throw error(401, { message: "unauthorized" });
	return json({ parsed });
};
