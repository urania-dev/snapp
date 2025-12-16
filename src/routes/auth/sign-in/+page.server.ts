import type { GenericOAuthConfig } from 'better-auth/plugins';

import { getHost } from '$lib/remotes/config.remote';
import fs from 'node:fs';

export const load = async () => {
	const oauthConfig = JSON.parse(
		fs.readFileSync('config/oauth.json', 'utf8')
	) as GenericOAuthConfig[];

	const host = await getHost();
	const accountProviders = oauthConfig.map(({ providerId }) => providerId);

	return { accountProviders, host };
};
