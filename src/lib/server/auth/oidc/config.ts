import { error } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { log } from '$lib/server/log';
import { Configuration, discovery } from 'openid-client';

export interface OidcConfig {
	authorizeUrl?: string;
	clientID: string;
	clientSecret: string;
	displayNameField: string;
	emailField: string;
	endSessionUrl?: string;
	identity: string;
	issuer: string;
	profilePictureField: string;
	provider: string;
	scope: string;
	tokenUrl?: string;
	userIdField: string;
	userinfoUrl?: string;
	userNameField: string;
}

const fetchClientConfig = async (oidcConfig: OidcConfig): Promise<Configuration> => {
	const useAutodiscover = oidcConfig.authorizeUrl === undefined;
	if (useAutodiscover)
		try {
			const config = await discovery(
				new URL(oidcConfig.issuer),
				oidcConfig.clientID,
				oidcConfig.clientSecret
			);
			return config;
		} catch (error) {
			if (env.LOG_LEVEL === 'debug') log.error(error);
		}

	return new Configuration(
		{
			authorization_endpoint: oidcConfig.authorizeUrl,
			end_session_endpoint: oidcConfig.endSessionUrl,
			issuer: oidcConfig.issuer,
			token_endpoint: oidcConfig.tokenUrl,
			userinfo_endpoint: oidcConfig.userinfoUrl
		},
		oidcConfig.clientID,
		oidcConfig.clientSecret
	);
};

export type Provider = {
	configuration: Configuration;
	identity: string;
	provider: string;
	rawConfig: OidcConfig;
};

export const getProviders = async () => {
	try {
		const parseOIDCConfigs = () => {
			const providers =
				(env.AUTH_PROVIDERS?.trim() !== '' &&
					env.AUTH_PROVIDERS?.trim()
						?.toString()
						?.split(',')
						.map((provider) => provider.trim())) ||
				[];

			if (!providers.length) return [];
			return providers.map((provider) => {
				const issuer = env[`AUTH_${provider}_ISSUER`];
				const clientID = env[`AUTH_${provider}_CLIENT_ID`];
				const clientSecret = env[`AUTH_${provider}_CLIENT_SECRET`];
				const scope = env?.[`AUTH_${provider}_SCOPE`] || 'openid profile email';
				const userNameField = env?.[`AUTH_${provider}_USERNAME_FIELD`] || 'preferred_username';
				const userIdField = env?.[`AUTH_${provider}_USERID_FIELD`] || 'id';
				const displayNameField = env?.[`AUTH_${provider}_DISPLAYNAME_FIELD`] || 'name';
				const profilePictureField = env?.[`AUTH_${provider}_PROFILE_PICTURE_FIELD`] || 'avatar';
				const emailField = env?.[`AUTH_${provider}_EMAIL_FIELD`] || 'email';

				Object.entries({
					clientID,
					clientSecret,
					displayNameField,
					emailField,
					issuer,
					profilePictureField,
					scope,
					userIdField,
					userNameField
				}).map(([key, value]) => {
					if (!value) {
						throw error(500, `Missing environment variables for ${provider}, ${key}`);
					}
				});

				return {
					authorizeUrl: env[`AUTH_${provider}_AUTHORIZE_URL`],
					clientID: clientID!,
					clientSecret: clientSecret!,
					displayNameField,
					emailField,
					endSessionUrl: env[`AUTH_${provider}_END_SESSION_URL`],
					identity: provider.toLocaleLowerCase(),
					issuer: issuer!,
					profilePictureField,
					provider: provider,
					scope,
					tokenUrl: env[`AUTH_${provider}_TOKEN_URL`],
					userIdField,
					userinfoUrl: env[`AUTH_${provider}_USERINFO_URL`],
					userNameField
				} satisfies OidcConfig;
			});
		};

		const result = await Promise.all(
			parseOIDCConfigs().map(async (config) => {
				const configuration = await fetchClientConfig(config);
				return {
					configuration,
					identity: config.identity,
					provider: config.provider,
					rawConfig: config
				};
			})
		);

		return result as Provider[];
	} catch {
		return [] as Provider[];
	}
};

export const getOIDCConfig = (identity: string, OIDCConfigs: Provider[]) => {
	return OIDCConfigs?.find((config) => config?.identity === identity);
};
