import { error, redirect } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { getOIDCConfig, getProviders } from '$lib/server/auth/oidc/config';
import { log } from '$lib/server/log';
import {
	buildAuthorizationUrl,
	calculatePKCECodeChallenge,
	randomPKCECodeVerifier,
	randomState
} from 'openid-client';

export const load = async ({ cookies, params: { provider } }) => {
	const providers = await getProviders();
	const config = getOIDCConfig(provider!, providers);

	if (!config) throw error(400, 'Provider not found');

	const redirectUri = `${env.ORIGIN}/auth/${config.identity}/callback`;

	const codeVerifier = randomPKCECodeVerifier();
	const codeChallenge = await calculatePKCECodeChallenge(codeVerifier);
	const state = randomState();

	const getAuthorizationUrl = () => {
		try {
			return buildAuthorizationUrl(config.configuration, {
				code_challenge: codeChallenge,
				code_challenge_method: 'S256',
				redirect_uri: redirectUri,
				scope: config.rawConfig.scope,
				state
			});
		} catch (error) {
			if (process.env.LOG_LEVEL === 'debug') log.error(error);
		}
	};
	const authorizationUrl = getAuthorizationUrl();
	cookies.set('oauth_state', state, {
		httpOnly: true,
		maxAge: 60 * 10,
		path: '/',
		sameSite: 'lax',
		secure: process.env.NODE_ENV !== 'development'
	});
	cookies.set('oauth_code', codeVerifier, {
		httpOnly: true,
		maxAge: 60 * 10,
		path: '/',
		sameSite: 'lax',
		secure: process.env.NODE_ENV !== 'development'
	});
	cookies.set('oauth_identity', config.identity, {
		httpOnly: true,
		maxAge: 60 * 10,
		path: '/',
		sameSite: 'lax',
		secure: process.env.NODE_ENV !== 'development'
	});
	if (authorizationUrl) redirect(302, authorizationUrl);

	return {
		error: 'errors.oidc-client-unavailable',
		provider
	};
};
