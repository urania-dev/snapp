import type { THost } from '$lib/schemas/host.schema';

import { getRequestEvent } from '$app/server';
import { m } from '$lib/paraglide/messages';
import { CONSTANTS } from '$lib/server/const.js';
import { db } from '$lib/server/db';
import * as schema from '$lib/server/db/schema';
import {
	sendInvitationEmail,
	sendInvitationToUser,
	sendOtpMail,
	sendResetPasswordMail,
	sendVerificationMail
} from '$lib/server/email/auth/emails';
import { settings } from '$lib/server/settings';
import { slugify } from '$lib/utils.js';
import { APIError, generateId, } from 'better-auth';
import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import {
	admin,
	apiKey,
	createAuthMiddleware,
	genericOAuth,
	type GenericOAuthConfig,
	openAPI,
	organization,
	twoFactor,
	username
} from 'better-auth/plugins';
import { sveltekitCookies } from 'better-auth/svelte-kit';
import { and, eq, isNotNull, sql } from 'drizzle-orm';
import fs from 'node:fs/promises';

import { ac, roles as r } from './permissions';

const config = settings.get();
export type AuthInstance = Awaited<ReturnType<typeof createBetterAuthClient>>;
class AuthCache {
	auth = new Map<string, AuthInstance>();
	roles = new Map<string, typeof r>();
}


export const authCache = new AuthCache();

const createBetterAuthClient = async (host: THost) => {
	const oauthConfig = JSON.parse(
		await fs.readFile('config/oauth.json', 'utf8')
	) as GenericOAuthConfig[];

	const hostId = slugify(host.origin);

	if (!authCache.roles.has(hostId)) {
		const dbRoles = await db.query.organizationRole.findMany({
			where: { organizationId: hostId }
		});
		const computedFromDb = Object.fromEntries(
			dbRoles.map((r) => [r.role, ac.newRole(JSON.parse(r.permission))])
		) as Partial<typeof r>;

		const computed = {
			...r,
			...computedFromDb
		} satisfies typeof r;

		authCache.roles.set(hostId, computed);
	}

	if (CONSTANTS.DEBUG) console.log('[settings] refresh client %s', host.origin);
	const auth = betterAuth({
		advanced: {
			ipAddress: {
				disableIpTracking: true
			}
		},
		basePath: '/api/auth',
		baseURL: host.origin,
		database: drizzleAdapter(db,{
			camelCase:true,
			provider:"pg",
			schema,
			
		}),
		emailAndPassword: {
			autoSignIn: false,
			disableSignUp: host.options.disable.signup === true,
			enabled: true,
			requireEmailVerification: true,
			sendResetPassword: async ({ token, url, user }) => {
				if (url.endsWith('reset-password')) {
					await sendResetPasswordMail({ token, url, user });
				}
				if (url.endsWith('complete-registration')) {
					await sendInvitationToUser({ email: user.email, token, url });
				}
			}
		},
		emailVerification: {
			autoSignInAfterVerification: true,
			sendOnSignIn: true,
			sendOnSignUp: true,
			sendVerificationEmail: async ({ token, url, user }) => {
				await sendVerificationMail({ token, url, user });
			}
		},
		hooks: {
			before: createAuthMiddleware(async (ctx) => {
				if (!ctx.path.startsWith('/sign')) {
					return;
				}
				const [username = null, domain = null] = (ctx.body?.email || '').split('@');
				const valid = await db.transaction(async (tx) => {
					const validEmail = await tx.query.watchlist.findFirst({
						where: { allowed: true, domain: domain || undefined, username: username || undefined }
					});
					const validUsername = await tx.query.watchlist.findFirst({
						where: { allowed: true, username: ctx.body.username || undefined }
					});
					const validDomain = await tx.query.watchlist.findFirst({
						where: { allowed: true, domain: ctx.body.username || undefined }
					});
					const validDomainCount = await tx
						.select({
							count: sql`count(*)`.mapWith(Number)
						})
						.from(schema.watchlist)
						.where(and(eq(schema.watchlist.allowed, true), isNotNull(schema.watchlist.domain)))
						.then((r) => r[0]?.count);

					if (validEmail || validUsername || validDomain) {
						return true;
					}
					const blacklistedEmail = await tx.query.watchlist.findFirst({
						where: {
							allowed: false,
							domain: domain || undefined,
							username: username || undefined
						}
					});
					const blacklistedUsername = await tx.query.watchlist.findFirst({
						where: {
							allowed: false,
							username: ctx.body.username || undefined
						}
					});
					const blacklistedDomain = await tx.query.watchlist.findFirst({
						where: {
							allowed: false,
							domain: domain || undefined
						}
					});
					if (blacklistedEmail || blacklistedUsername || blacklistedDomain) {
						return false;
					}
					if (validDomainCount !== 0) {
						return false;
					}
					return true;
				});
				if (!valid)
					throw new APIError('NOT_ACCEPTABLE', {
						message: m.blacklisted()
					});
			})
		},
		plugins: [
			admin(),
			apiKey({
				keyExpiration: {
					defaultExpiresIn: null,
					disableCustomExpiresTime: false,
					maxExpiresIn: 365_000
				}
			}),
			
			genericOAuth({
				config: oauthConfig,
			}),
			organization({
				ac,
				disableOrganizationDeletion: false,
				dynamicAccessControl: {
					enabled: true,
					maximumRolesPerOrganization: 100
				},
				organizationHooks: {
					afterCreateTeam: async()=>{
						authCache.auth.delete(slugify(host.origin))
					},
					beforeCreateOrganization: async (data) => {
						return { data: { ...data.organization, id: data.organization.slug } };
					},
					beforeCreateTeam: async (data) => {
						return { data: { ...data, team: { ...data.team, id: generateId(24) } } };
					}
				},
				roles: authCache.roles.get(hostId) || r,
				sendInvitationEmail: async (data) => {
					await sendInvitationEmail({
						invite: {
							email: data.email,
							id: data.id,
							invitation: data.invitation,
							inviter: data.inviter,
							organization: data.organization,
							role: data.role
						}
					});
				},
				teams: {
					allowRemovingAllTeams: true,
					defaultTeam: {
						enabled: false
					},
					enabled: true,
					maximumTeams: 100
				}
			}),
			username({
				async usernameValidator(username) {
					return await db.transaction(async (tx) => {
						const blacklisted = await tx.query.watchlist.findFirst({
							where: {
								allowed: false,
								username: username
							}
						});

						const whitelisted = await tx.query.watchlist.findFirst({
							where: {
								allowed: true,
								username: username
							}
						});

						if (!blacklisted || whitelisted) return true;
						else return false;
					});
				}
			}),
			twoFactor({
				issuer: config.appname,
				otpOptions: {
					sendOTP: async ({ otp, user }) => {
						await sendOtpMail({ otp, user });
					}
				},
				totpOptions: {
					period: 30
				}
			}),
			openAPI(),
			sveltekitCookies(getRequestEvent)
		],
		rateLimit: {
			customRules: {
				'*': getApiKeyRateLimit(host)
			},
			enabled: host.options.disable.limits === false,
			storage: 'database'
		},
		session: {
			cookieCache: {
				enabled: true,
				maxAge: 60 * 5
			}
		},
		socialProviders: {
			facebook:
				(process.env.FACEBOOK_CLIENT_ID && {
					clientId: process.env.FACEBOOK_CLIENT_ID as string,
					clientSecret: process.env.FACEBOOK_CLIENT_SECRET as string
				}) ||
				undefined,
			github:
				(process.env.GITHUB_CLIENT_ID && {
					clientId: process.env.GITHUB_CLIENT_ID as string,
					clientSecret: process.env.GITHUB_CLIENT_SECRET as string
				}) ||
				undefined,
			google:
				(process.env.GOOGLE_CLIENT_ID && {
					clientId: process.env.GOOGLE_CLIENT_ID as string,
					clientSecret: process.env.GOOGLE_CLIENT_SECRET as string
				}) ||
				undefined
		},
		telemetry: { enabled: false },
		user: {
			additionalFields: {
				notes: {
					defaultValue: '',
					fieldName: 'notes',
					required: false,
					type: 'string'
				},
				username: {
					fieldName: 'username',
					required: true,
					type: 'string'
				}
			},
			deleteUser: {
				enabled: true
			}
		}
	});
	return auth;
};

const getBetterAuth = async (host: THost) => {
	const hostId = slugify(host.origin);
	if (!authCache.auth.has(hostId)) {
		const newCache = await createBetterAuthClient(host)
		authCache.auth.set(hostId, newCache);

		return newCache
	}

	return authCache.auth.get(hostId)!;
};
export { getBetterAuth };

export function getApiKeyRateLimit(host: THost) {
	const rpd = host.options.limits?.requestsPerDay || 100;
	const rpm = host.options.limits?.requestsPerMinute || 1440;
	const rpdAsPerMinute = Math.floor(rpd / 1440);
	const effectiveRpm = Math.min(rpm, rpdAsPerMinute);
	return {
		max: effectiveRpm,
		window: 60 * 1000
	};
}
