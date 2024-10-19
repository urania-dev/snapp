import { env } from '$env/dynamic/private';
import { discovery, Configuration } from 'openid-client';


export interface OidcConfig {
  identity: string;
  provider: string;
  issuer: string;
  clientID: string;
  clientSecret: string;
  authorizeUrl?: string;
  tokenUrl?: string;
  userinfoUrl?: string;
  endSessionUrl?: string;
  scope: string;
  userNameField: string;
  userIdField: string;
  displayNameField: string;
  profilePictureField: string;
  emailField: string;
}

const fetchClientConfig = async (
  oidcConfig: OidcConfig,
): Promise<Configuration> => {
  const useAutodiscover = oidcConfig.authorizeUrl === undefined;
  return useAutodiscover
    ? await discovery(new URL(oidcConfig.issuer), oidcConfig.clientID, oidcConfig.clientSecret)
    : new Configuration({
      issuer: oidcConfig.issuer,
      authorization_endpoint: oidcConfig.authorizeUrl,
      token_endpoint: oidcConfig.tokenUrl,
      userinfo_endpoint: oidcConfig.userinfoUrl,
      end_session_endpoint: oidcConfig.endSessionUrl,
    }, oidcConfig.clientID, oidcConfig.clientSecret);
};

const parseOIDCConfigs = () => {
  const providers = env.AUTH_PROVIDERS?.split(',').map(provider => provider.trim()) ?? [];
  return providers.map(provider => {
    const issuer = env[`AUTH_${provider}_ISSUER`];
    const clientID = env[`AUTH_${provider}_CLIENT_ID`];
    const clientSecret = env[`AUTH_${provider}_CLIENT_SECRET`];
    const scope = env[`AUTH_${provider}_SCOPE`] ?? 'openid profile email';
    const userNameField = env[`AUTH_${provider}_USERNAME_FIELD`] ?? 'preferred_username';
    const userIdField = env[`AUTH_${provider}_USERID_FIELD`] ?? 'id';
    const displayNameField = env[`AUTH_${provider}_DISPLAYNAME_FIELD`] ?? 'name';
    const profilePictureField = env[`AUTH_${provider}_PROFILE_PICTURE_FIELD`] ?? 'avatar';
    const emailField = env[`AUTH_${provider}_EMAIL_FIELD`] ?? 'email';

    if (!issuer || !clientID || !clientSecret || !scope || !userNameField || !userIdField || !displayNameField || !profilePictureField || !emailField) {
      throw new Error(`Missing environment variables for ${provider}`);
    }

    return {
      identity: provider.toLocaleLowerCase(),
      provider: provider,
      issuer,
      clientID,
      clientSecret,
      authorizeUrl: env[`AUTH_${provider}_AUTHORIZE_URL`],
      tokenUrl: env[`AUTH_${provider}_TOKEN_URL`],
      userinfoUrl: env[`AUTH_${provider}_USERINFO_URL`],
      endSessionUrl: env[`AUTH_${provider}_END_SESSION_URL`],
      scope,
      userNameField,
      userIdField,
      displayNameField,
      profilePictureField,
      emailField,
    } satisfies OidcConfig;
  })
}

export const OIDCConfigs = await Promise.all(parseOIDCConfigs().map(async (config) => {
  const configuration = await fetchClientConfig(config);

  return {
    identity: config.identity,
    provider: config.provider,
    configuration,
    rawConfig: config
  }
}));

export const getOIDCConfig = (identity: string) => {
  return OIDCConfigs.find(config => config.identity === identity);
}


