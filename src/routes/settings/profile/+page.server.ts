import type { GenericOAuthConfig } from "better-auth/plugins";

import fs from "node:fs";

export const load = async ({ parent }) => {
	const oauthConfig = JSON.parse(
		fs.readFileSync("config/oauth.json", "utf8")
	) as GenericOAuthConfig[];

	const data = await parent();
	const accountProviders = oauthConfig.map(({ providerId }) => providerId);

	return { ...data, accountProviders };
};
