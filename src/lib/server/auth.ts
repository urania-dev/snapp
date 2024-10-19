import { Lucia } from 'lucia';
import { env } from '$env/dynamic/private';
import { OAuth2Client } from 'oslo/oauth2';
import { PrismaAdapter } from '@lucia-auth/adapter-prisma';
import { prisma } from '$lib/server/prisma';
import { type OAuth2ProviderWithPKCE } from 'arctic';

const adapter = new PrismaAdapter(prisma.session, prisma.user);

export const lucia = new Lucia(adapter, {
	sessionCookie: {
		attributes: {
			// set to `true` when using HTTPS
			secure: process.env.NODE_ENV !== 'development'
		}
	},
	getUserAttributes: (attributes) => {
		return {
			// attributes has the type of DatabaseUserAttributes
			username: attributes.username,
			email: attributes.email,
			role: attributes.role,
			createdAt: attributes.createdAt,
			updatedAt: attributes.updatedAt,
			notes: attributes.notes,
			setupTwoFactor: typeof attributes.two_factor_secret === 'string'
		};
	},
	getSessionAttributes: (attributes) => {
		return {
			twoFactorVerified: attributes.two_factor_verified
		}
	}
});

declare module 'lucia' {
	interface Register {
		Lucia: typeof lucia;
		DatabaseUserAttributes: DatabaseUserAttributes;
		DatabaseSessionAttributes: DatabaseSessionAttributes
	}
}

interface DatabaseUserAttributes {
	username: string;
	email: string;
	role: 'user' | 'admin' | 'root';
	updatedAt: Date;
	createdAt: Date;
	notes: string;
	two_factor_secret: string | null
}
interface DatabaseSessionAttributes {
	two_factor_verified: boolean
}

declare module 'lucia' {
	interface Register {
		Lucia: typeof lucia;
	}
}


import { TimeSpan, createDate } from "oslo";

export class Authelia implements OAuth2ProviderWithPKCE {
	private client: OAuth2Client;
	private clientSecret: string;

	constructor(issuer: string, clientId: string, clientSecret: string, redirectURI: string) {
		const authorizeEndpoint = issuer.replace(/\/$/, "") + "/api/oidc/authorization";
		const tokenEndpoint = issuer.replace(/\/$/, "") + "/api/oidc/token";
		this.client = new OAuth2Client(clientId, authorizeEndpoint, tokenEndpoint, {
			redirectURI
		});
		this.clientSecret = clientSecret;
	}

	public async createAuthorizationURL(
		state: string,
		codeVerifier: string,
		options?: {
			scopes?: string[];
		}
	): Promise<URL> {
		const scopes = options?.scopes ?? [];
		return await this.client.createAuthorizationURL({
			state,
			codeVerifier,
			scopes: [...scopes, "openid"]
		});
	}

	public async validateAuthorizationCode(
		code: string,
		codeVerifier: string
	): Promise<AuthentliaTokens> {
		const result = await this.client.validateAuthorizationCode<AuthorizationCodeResponseBody>(code, {
			authenticateWith: "request_body",
			credentials: this.clientSecret,
			codeVerifier
		});
		const tokens: AuthentliaTokens = {
			accessToken: result.access_token,
			accessTokenExpiresAt: createDate(new TimeSpan(result.expires_in, "s")),
			refreshToken: result.refresh_token ?? null,
			idToken: result.id_token,
			email: result.email,
			emailVerified: result.email_verified,
			username: result.preferred_username,
			name: result.name
		};
		return tokens;
	}

	public async refreshAccessToken(refreshToken: string): Promise<AuthentliaRefreshedTokens> {
		const result = await this.client.refreshAccessToken<RefreshedTokenResponseBody>(refreshToken, {
			credentials: this.clientSecret
		});
		const tokens: AuthentliaRefreshedTokens = {
			accessToken: result.access_token,
			accessTokenExpiresAt: createDate(new TimeSpan(result.expires_in, "s")),
			refreshToken: result.refresh_token ?? null,
			idToken: result.id_token,
		};
		return tokens;
	}
}

interface RefreshedTokenResponseBody {
	access_token: string;
	expires_in: number;
	refresh_token?: string;
	id_token: string;
}

interface AuthorizationCodeResponseBody {
	access_token: string;
	expires_in: number;
	refresh_token?: string;
	id_token: string;
	email: string;
	email_verified: boolean;
	preferred_username: string;
	name: string;
}

export interface AuthentliaRefreshedTokens {
	accessToken: string;
	accessTokenExpiresAt: Date;
	refreshToken: string | null;
	idToken: string;
}

export interface AuthentliaTokens {
	accessToken: string;
	accessTokenExpiresAt: Date;
	refreshToken: string | null;
	idToken: string;
	email: string;
	emailVerified: boolean;
	username: string;
	name: string
}

export const oauth = new Authelia(env.AUTH_AUTHELIA_ISSUER, env.AUTH_AUTHELIA_CLIENT_ID, env.AUTH_AUTHELIA_CLIENT_SECRET, `${env.ORIGIN}/auth/oauth/callback`);

