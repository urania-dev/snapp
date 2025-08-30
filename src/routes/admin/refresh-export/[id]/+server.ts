import { error, json } from "@sveltejs/kit";
import { DEBUG } from "$lib/server/config/index.js";
import { log } from "$lib/server/log";
import { existsSync, unlinkSync } from "fs";
import path from "path";

export const GET = async ({ fetch, locals: { user }, params: { id } }) => {
	if (!user || (user.id !== id && user.role === "user")) {
		throw error(401, { message: "errors.unauthorized" });
	}

	const csvDir = path.resolve("output");
	const csvPath = path.join(csvDir, `${id}.csv`);

	if (existsSync(csvPath)) {
		if (DEBUG) log.info("CSV exist.");
		unlinkSync(csvPath);
	}

	try {
		await fetch("/admin/check-export/" + id);
	} catch (error) {
		log.error(error);
	}

	return json({ success: true });
};
