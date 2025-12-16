import { goto } from '$app/navigation';
import { resolve } from '$app/paths';
import { createAuthClient } from 'better-auth/client';
import {
	adminClient,
	apiKeyClient,
	genericOAuthClient,
	inferAdditionalFields,
	organizationClient,
	twoFactorClient,
	usernameClient
} from 'better-auth/client/plugins';

import type { AuthInstance } from './server';

import { ac, roles } from './permissions';
export const getAuthClient = (baseURL: string, f: Fetch) =>
	createAuthClient({
		baseURL,
		fetchOptions: {
			customFetchImpl: f
		},
		plugins: [
			adminClient(),
			apiKeyClient(),
			genericOAuthClient(),
			organizationClient({
				ac,
				dynamicAccessControl: {
					enabled: true
				},
				roles,
				teams: { enabled: true }
			}),
			twoFactorClient({
				onTwoFactorRedirect: async () => {
					await goto(resolve('/auth/2fa'));
				}
			}),
			usernameClient(),
			inferAdditionalFields<AuthInstance>(),
		]
	});

export type AuthClient = ReturnType<typeof getAuthClient>;
