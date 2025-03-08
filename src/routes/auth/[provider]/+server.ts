import { type Action, error, redirect } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { getOIDCConfig } from '$lib/server/auth/oidc/config';
import {
	buildAuthorizationUrl,
	calculatePKCECodeChallenge,
	randomPKCECodeVerifier,
	randomState
} from 'openid-client';

export const GET: Action = async ({ cookies, params: { provider } }) => {
	const config = getOIDCConfig(provider!);

	if (!config) {
		throw error(400, 'Provider not found');
	}

	const redirectUri = `${env.ORIGIN}/auth/${config.identity}/callback`;

	const codeVerifier = randomPKCECodeVerifier();
	const codeChallenge = await calculatePKCECodeChallenge(codeVerifier);
	const state = randomState();

	const authorizationUrl = buildAuthorizationUrl(config.configuration, {
		code_challenge: codeChallenge,
		code_challenge_method: 'S256',
		redirect_uri: redirectUri,
		scope: config.rawConfig.scope,
		state
	});

	cookies.set('oauth_state', state, {
		httpOnly: true,
		maxAge: 60 * 10,
		path: '/',
		sameSite: 'lax',
		secure: import.meta.env.PROD
	});
	cookies.set('oauth_code', codeVerifier, {
		httpOnly: true,
		maxAge: 60 * 10,
		path: '/',
		sameSite: 'lax',
		secure: import.meta.env.PROD
	});
	cookies.set('oauth_identity', config.identity, {
		httpOnly: true,
		maxAge: 60 * 10,
		path: '/',
		sameSite: 'lax',
		secure: import.meta.env.PROD
	});

	redirect(302, authorizationUrl);
};
