import { error, redirect } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { prisma } from '$lib/db/prisma';
import {
	createSession,
	generateSessionToken,
	setSessionTokenCookie
} from '$lib/server/auth/index.js';
import { getOIDCConfig, getProviders } from '$lib/server/auth/oidc/config';
import { getSettings } from '$lib/server/config';
import { slugify } from '$lib/utils.js';
import { authorizationCodeGrant, fetchUserInfo } from 'openid-client';

export const GET = async (event) => {
	const {
		cookies,
		params: { provider },
		url
	} = event;
	const cookieProviderIdentity = cookies.get('oauth_identity') ?? null;
	const storedState = cookies.get('oauth_state') ?? null;
	const codeVerifier = cookies.get('oauth_code') ?? null;

	if (!storedState || !codeVerifier) {
		throw error(400, 'STATE and STORE STATE not matching OR missing code verifier');
	}

	if (!cookieProviderIdentity || cookieProviderIdentity !== provider) {
		throw error(400, 'Provider not found in cookie');
	}

	const providers = await getProviders()
	const config = getOIDCConfig(provider!,providers);
	
	if (!config) {
		throw error(400, 'Provider not found');
	}
	const settings = await getSettings();
	const enabledSignup = settings.get<boolean>('ENABLE_SIGNUP');
	if (!enabledSignup) redirect(302, '/auth/sign-up');

	url.protocol = new URL(env.ORIGIN).protocol; // fix for reverse proxy
	try {
		const tokens = await authorizationCodeGrant(
			config.configuration,
			url,
			{
				expectedState: storedState,
				idTokenExpected: true,
				pkceCodeVerifier: codeVerifier
			},
			undefined
		);

		const settings = await getSettings();

		const claims = tokens.claims();

		if (!claims) {
			throw error(400, 'Missing claims');
		}

		const oauthUser = await fetchUserInfo(config.configuration, tokens.access_token, claims.sub);

		const email = oauthUser[config.rawConfig.emailField];

		if (!email || typeof email !== 'string') {
			throw error(400, 'Missing email');
		}

		// Replace this with your own DB client.
		const existingUser = await prisma.user.findFirst({ where: { email } });

		if (existingUser) {
			const sessionId = generateSessionToken();
			const session = await createSession(sessionId, existingUser.id);
			setSessionTokenCookie(event, sessionId, session.expiresAt);
		} else {
			const enabledSignup = settings.get('ENABLE_SIGNUP');
			if (!enabledSignup) redirect(302, '/auth/sign-up');
			const password = generateSessionToken();
			const user = await prisma.user.create({
				data: {
					email,
					password,
					username: slugify(email.split('@')[0].slice(0, 20)),
					verified: true
				}
			});
			const sessionId = generateSessionToken();
			const session = await createSession(sessionId, user.id);
			setSessionTokenCookie(event, sessionId, session.expiresAt);
		}
	} catch (err) {
		return new Response((err as Error).message, { status: 500 });
	}

	cookies.delete('oauth_code', {
		httpOnly: true,
		maxAge: 60 * 10,
		path: '/',
		sameSite: 'strict',
		secure: import.meta.env.PROD
	});
	cookies.delete('oauth_state', {
		httpOnly: true,
		maxAge: 60 * 10,
		path: '/',
		sameSite: 'strict',
		secure: import.meta.env.PROD
	});
	cookies.delete('oauth_identity', {
		httpOnly: true,
		maxAge: 60 * 10,
		path: '/',
		sameSite: 'strict',
		secure: import.meta.env.PROD
	});
	redirect(302, '/dashboard');
};
