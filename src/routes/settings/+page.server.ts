import type { Snapp } from '@prisma/client';

import { fail, redirect } from '@sveltejs/kit';
import { umamiSchema, vtAPISchema } from '$lib/components/settings/adminPanel/schema';
import { rateSchema } from '$lib/components/settings/limits/schema';
import { profileSchema, smtpSchema } from '$lib/components/settings/schema';
import { blackListSchema } from '$lib/components/settings/watchlists/blacklists/schema';
import { whiteListSchema } from '$lib/components/settings/watchlists/whitelists/schema';
import { prisma } from '$lib/db/prisma.js';
import {
	createPasswordResetToken,
	deleteSessionTokenCookie,
	invalidateSessions
} from '$lib/server/auth';
import { createToken } from '$lib/server/auth/db.js';
import { convertTtlToString } from '$lib/utils';
import { getSettings } from '$lib/server/config';
import ForgotPasswordEmail from '$lib/server/emails/auth/forgotPasswordEmail.svelte';
import SmtpTest from '$lib/server/emails/smtpTest.svelte';
import {
	updateLimiterConfigPerDay,
	updateLimiterConfigPerMinute
} from '$lib/server/limits/handle.js';
import { log } from '$lib/server/log';
import { sendEmail } from '$lib/server/smtp';
import * as shiki from 'shiki';
import { superValidate } from 'sveltekit-superforms';
import { zod } from 'sveltekit-superforms/adapters';
import type { StringValue } from 'ms';

export const load = async ({ locals: { prisma, theme, user } }) => {
	if (!user) redirect(302, '/dashboard');
	const settings = await getSettings();
	const isAdmin = user.role === 'admin' || user.role === 'root';
	const parsed = settings.list();

	return {
		allowUnsecureHTTP: parsed.ALLOW_UNSECURE_HTTP as boolean,
		availableLanguages: parsed.AVAILABLE_LANGUAGES as string | undefined,
		blackListForm: isAdmin && (await superValidate(zod(blackListSchema))),
		customRedirect: (isAdmin && (parsed.CUSTOM_REDIRECT as string)) || null,
		disableHome: isAdmin && (parsed.DISABLE_HOME as boolean),
		enableLimits: isAdmin && (parsed.ENABLE_LIMITS as boolean),
		enableSignup: isAdmin && (parsed.ENABLE_SIGNUP as boolean),
		limitForm:
			isAdmin &&
			(await superValidate(
				{
					rpd: String(parsed.RPD_REQUESTS as string) || undefined,
					rpm: String(parsed.RPM_REQUESTS as string) || undefined,
					spu: String(parsed.MAX_SNAPPS_PER_USER as string) || undefined
				},
				zod(rateSchema)
			)),
		private: await prisma.setting.findMany({ where: { userId: user.id } }),
		profileForm: await superValidate(
			{ email: user.email, username: user.username },
			zod(profileSchema)
		),
		sampleCode: await code(theme),
		serverSideEnabledMFA: parsed.ENABLED_MFA as boolean,
		smtp: {
			from: parsed.SMTP_FROM as string,
			host: parsed.SMTP_HOST as string,
			pass: parsed.SMTP_PASS as string,
			port: parsed.SMTP_PORT as number,
			ssl: parsed.SMTP_SSL as boolean,
			user: parsed.SMTP_USER as string
		},
		smtpForm:
			isAdmin &&
			(await superValidate(
				{
					from: (parsed.SMTP_FROM as string) || '',
					host: (parsed.SMTP_HOST as string) || '',
					pass: (parsed.SMTP_PASS as string) || '',
					port: (parsed.SMTP_PORT as number) || 25,
					ssl: (parsed.SMTP_SSL as boolean) || false,
					user: (parsed.SMTP_USER as string) || ''
				},
				zod(smtpSchema)
			)),
		token: await prisma.token.findFirst({ where: { userId: user.id } }),
		umamiForm:
			isAdmin &&
			(await superValidate(
				{
					url: ((parsed.PUBLIC_UMAMI_WEBSITE_URL !== null && parsed.PUBLIC_UMAMI_WEBSITE_URL) ||
						undefined) as string | undefined,
					websiteId: ((parsed.PUBLIC_UMAMI_WEBSITE_ID !== null && parsed.PUBLIC_UMAMI_WEBSITE_ID) ||
						undefined) as string | undefined
				},
				zod(umamiSchema)
			)),
		user,
		vtApiForm:
			isAdmin && (await superValidate({ secret: parsed.VTAPI_KEY as string }, zod(vtAPISchema))),
		whiteListForm: isAdmin && (await superValidate(zod(whiteListSchema)))
	};
};

export const actions = {
	allowHTTP: async ({ locals: { prisma, user }, request }) => {
		if (!user) redirect(302, '/auth/sign-in');
		if (!['admin', 'root'].includes(user.role)) {
			return fail(403, { message: 'errors.unauthorized' });
		}
		const form = await request.formData();
		const http = form.get('http')?.toString();
		if (http !== undefined) {
			await prisma.setting.upsert({
				create: {
					field: 'ALLOW_UNSECURE_HTTP',
					id: 'ALLOW_UNSECURE_HTTP',
					userId: null,
					value: http
				},
				update: { value: http },
				where: {
					field: 'ALLOW_UNSECURE_HTTP',
					id: 'ALLOW_UNSECURE_HTTP',
					userId: null
				}
			});
			const settings = await getSettings();
			await settings.updateDB();

			return { message: 'globals.saved' };
		}
	},
	blacklist: async (event) => {
		const {
			locals: { prisma, user }
		} = event;
		if (!user) redirect(302, '/auth/sign-in');
		const blackListForm = await superValidate(event, zod(whiteListSchema));
		if (!blackListForm.valid) {
			return fail(400, {
				blackListForm
			});
		}
		const entity = blackListForm.data.entity;
		let domain: string | undefined, username: string | undefined;

		switch (true) {
			case /^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/.test(entity):
				[username, domain] = entity.split('@');
				break;

			case entity.includes('.'):
				domain = entity;
				break;

			default:
				username = entity;
				domain = undefined;
				break;
		}
		const id =
			domain && username
				? `${domain}:` + `${username}`
				: domain
					? `domain:${domain}`
					: username
						? `username:${username}`
						: undefined;

		if (!id) return fail(500, { message: 'errors.generic' });

		await prisma.watchList.upsert({
			create: { allowed: false, domain, id, username },
			update: { allowed: false, domain, username },
			where: { id }
		});

		return {
			blackListForm
		};
	},
	customRedirect: async ({ locals: { prisma, user }, request }) => {
		if (!user) redirect(302, '/auth/sign-in');
		if (!['admin', 'root'].includes(user.role)) {
			return fail(403, { message: 'errors.unauthorized' });
		}
		const form = await request.formData();
		const customRedirect = form.get('customRedirect')?.toString();
		if (customRedirect !== undefined) {
			await prisma.setting.upsert({
				create: {
					field: 'CUSTOM_REDIRECT',
					id: 'CUSTOM_REDIRECT',
					userId: null,
					value: customRedirect
				},
				update: { value: customRedirect },
				where: { field: 'CUSTOM_REDIRECT', id: 'CUSTOM_REDIRECT', userId: null }
			});

			const settings = await getSettings();
			await settings.updateDB();
			return { message: 'globals.saved' };
		}
	},
	enableSignup: async ({ locals: { prisma, user }, request }) => {
		if (!user) redirect(302, '/auth/sign-in');
		if (!['admin', 'root'].includes(user.role)) {
			return fail(403, { message: 'errors.unauthorized' });
		}

		const form = await request.formData();
		const signup = form.get('signup')?.toString();
		if (signup !== undefined) {
			await prisma.setting.upsert({
				create: {
					field: 'ENABLE_SIGNUP',
					id: 'ENABLE_SIGNUP',
					userId: null,
					value: signup
				},
				update: { value: signup },
				where: { field: 'ENABLE_SIGNUP', id: 'ENABLE_SIGNUP', userId: null }
			});

			const settings = await getSettings();
			await settings.updateDB();
			return { message: 'globals.saved' };
		}
	},
	language: async ({ cookies, locals: { user }, request }) => {
		if (!user) redirect(302, '/auth/sign-in');
		const form = await request.formData();
		const lang = form.get('language')?.toString();
		if (lang) {
			cookies.set('language', lang, {
				httpOnly: true,
				path: '/',
				secure: process.env.NODE_ENV !== 'development'
			});
			return { message: 'globals.saved' };
		}
	},
	migrate: async (event) => {
		const {
			locals: { prisma, user }
		} = event;
		if (!user) redirect(302, '/auth/sign-in');

		const form = await event.request.formData();

		const snapps = form.getAll('snapp[]').map(
			(s) =>
				JSON.parse(s.toString()) as {
					group?: {
						connectOrCreate: {
							create: { name: string; notes: null; slug: string; users: string[] };
							where: { slug: string };
						};
					};
				} & Partial<Snapp>
		);
		try {
			for (const snapp of snapps) {
				if (!snapp.shortcode || !snapp.originalUrl) return;
				const groupId = snapp.groupId || null;
				const exists = await prisma.snapp.findFirst({ where: { shortcode: snapp.shortcode } });
				if (groupId && snapp.userId)
					await prisma.group.upsert({
						create: { name: groupId, slug: groupId, users: { connect: { id: snapp.userId } } },
						update: { slug: groupId },
						where: { slug: groupId }
					});
				if (!exists)
					await prisma.snapp.create({
						data: {
							createdAt: snapp.createdAt,
							disabled: snapp.disabled || false,
							expiresAt: snapp.expiresAt,
							groupId,
							hit: snapp.hit,
							maxUsages: snapp.maxUsages,
							notes: snapp.notes,
							originalUrl: snapp.originalUrl,
							secret: snapp.secret || null,
							shortcode: snapp.shortcode,
							userId: (snapp.userId && snapp.userId) || user.id,
							utmParams: snapp.utmParams
						}
					});
			}
		} catch (error) {
			log.error(error);
		}
		return { message: 'globals.saved' };
	},
	profile: async (event) => {
		const {
			locals: { prisma, user }
		} = event;
		if (!user) redirect(302, '/auth/sign-in');
		const profileForm = await superValidate(event, zod(profileSchema));
		if (!profileForm.valid) {
			return fail(400, {
				profileForm
			});
		}
		await prisma.user.update({
			data: { ...profileForm.data },
			where: { id: user.id }
		});

		return { message: 'globals.saved', profileForm, success: true };
	},
	rates: async (event) => {
		const {
			locals: { prisma, user }
		} = event;
		if (!user) redirect(302, '/auth/sign-in');
		const limitForm = await superValidate(event, zod(rateSchema));
		if (!limitForm.valid) {
			return fail(400, {
				limitForm
			});
		}
		const settings = await getSettings();

		await prisma.setting.upsert({
			create: {
				field: 'RPM_REQUESTS',
				id: 'RPM_REQUESTS',
				value: `${limitForm.data.rpm || null}`
			},
			update: { value: `${limitForm.data.rpm || null}` },
			where: { id: 'RPM_REQUESTS' }
		});
		await prisma.setting.upsert({
			create: {
				field: 'RPD_REQUESTS',
				id: 'RPD_REQUESTS',
				value: `${limitForm.data.rpd || null}`
			},
			update: { value: `${limitForm.data.rpd || null}` },
			where: { id: 'RPD_REQUESTS' }
		});
		await prisma.setting.upsert({
			create: {
				field: 'MAX_SNAPPS_PER_USER',
				id: 'MAX_SNAPPS_PER_USER',
				value: `${limitForm.data.spu || null}`
			},
			update: { value: `${limitForm.data.spu || null}` },
			where: { id: 'MAX_SNAPPS_PER_USER' }
		});
		await settings.updateDB();
		await updateLimiterConfigPerDay();
		await updateLimiterConfigPerMinute();
		return {
			limitForm,
			message: 'globals.saved'
		};
	},
	resetMFA: async ({ locals: { prisma, user } }) => {
		if (!user) redirect(302, '/auth/sign-in');
		await prisma.user.update({
			data: { tfs: null },
			where: { id: user.id }
		});

		return { message: 'globals.saved' };
	},
	resetPassword: async ({ locals: { user }, request, url }) => {
		if (!user) redirect(302, '/auth/sign-in');
		const settings = await getSettings();

		const { tokenHash } = await createPasswordResetToken(user.id);
		const recoveryURL = `${url.origin}/auth/recover-password?token=${tokenHash}`;
		const appname = settings.get<string>('appname') || 'Snapp';
		const ip = request.headers.get('X-FORWARDED-FOR') || '[no ip traceable.]';

		sendEmail(
			ForgotPasswordEmail,
			{ appname, ip, recoveryURL },
			user.email,
			appname + ' | Requested reset password'
		);

		return {
			message: 'users.auth.post-email-message',
			success: true
		};
	},
	signOut: async (event) => {
		const {
			locals: { user }
		} = event;
		if (!user) redirect(302, '/auth/sign-in');

		await invalidateSessions(user.id);
		deleteSessionTokenCookie(event);

		redirect(302, '/auth/sign-in');
	},
	testSMTP: async (event) => {
		const {
			locals: { user }
		} = event;
		if (!user) redirect(302, '/auth/sign-in');

		if (!['admin', 'root'].includes(user.role)) {
			return fail(403, { message: 'errors.unauthorized' });
		}

		try {
			const settings = await getSettings();
			const ip = event.request.headers.get('X-FORWARDED-FOR') || '[no ip traceable.]';
			const appname = settings.get<string>('appname') || 'Snapp';
			await sendEmail(SmtpTest, { ip }, user.email, appname + ' | Testing SMTP Transport');
			return {
				message: 'users.auth.post-email-message',
				success: true
			};
		} catch (error) {
			if (process.env.LOG_LEVEL === 'debug') log.error(error);
			return fail(403, { message: 'errors.generic' });
		}
	},
	theme: async ({ cookies, locals: { user }, request }) => {
		if (!user) redirect(302, '/auth/sign-in');
		const form = await request.formData();
		const theme = form.get('theme')?.toString();
		if (theme) {
			cookies.set('theme', theme, {
				httpOnly: true,
				path: '/',
				secure: process.env.NODE_ENV !== 'development'
			});
			return { message: 'globals.saved' };
		}
	},
	toggleHome: async ({ locals: { prisma, user }, request }) => {
		if (!user) redirect(302, '/auth/sign-in');
		if (!['admin', 'root'].includes(user.role)) {
			return fail(403, { message: 'errors.unauthorized' });
		}
		const form = await request.formData();
		const home = form.get('home')?.toString();
		if (home !== undefined) {
			await prisma.setting.upsert({
				create: {
					field: 'DISABLE_HOME',
					id: 'DISABLE_HOME',
					userId: null,
					value: home
				},
				update: { value: home },
				where: { field: 'DISABLE_HOME', id: 'DISABLE_HOME', userId: null }
			});
			const settings = await getSettings();
			await settings.updateDB();

			return { message: 'globals.saved' };
		}
	},
	toggleLimits: async ({ locals: { prisma, user }, request }) => {
		if (!user) redirect(302, '/auth/sign-in');
		if (!['admin', 'root'].includes(user.role)) {
			return fail(403, { message: 'errors.unauthorized' });
		}

		const form = await request.formData();
		const limits = form.get('limits')?.toString();
		if (limits !== undefined) {
			await prisma.setting.upsert({
				create: {
					field: 'ENABLE_LIMITS',
					id: 'ENABLE_LIMITS',
					userId: null,
					value: limits
				},
				update: { value: limits },
				where: { field: 'ENABLE_LIMITS', id: 'ENABLE_LIMITS', userId: null }
			});
			const settings = await getSettings();
			await settings.updateDB();

			return { message: 'globals.saved' };
		}
	},
	toggleMFA: async ({ locals: { prisma, user }, request }) => {
		if (!user) redirect(302, '/auth/sign-in');
		if (!['admin', 'root'].includes(user.role)) {
			return fail(403, { message: 'errors.unauthorized' });
		}

		const form = await request.formData();
		const mfa = form.get('mfa')?.toString();
		if (mfa !== undefined) {
			await prisma.setting.upsert({
				create: { field: 'ENABLED_MFA', id: 'ENABLED_MFA', value: mfa },
				update: { value: mfa },
				where: { field: 'ENABLED_MFA', id: 'ENABLED_MFA' }
			});
			const settings = await getSettings();
			await settings.updateDB();

			return { message: 'globals.saved' };
		}
	},
	toggleMFAPrivate: async ({ locals: { prisma, user }, request }) => {
		if (!user) redirect(302, '/auth/sign-in');

		const form = await request.formData();
		const mfa = form.get('mfa')?.toString();
		if (mfa !== undefined) {
			await prisma.setting.upsert({
				create: {
					field: 'ENABLED_MFA',
					id: 'ENABLED_MFA_' + user.id,
					userId: user.id,
					value: mfa
				},
				update: { value: mfa },
				where: { field: 'ENABLED_MFA', id: 'ENABLED_MFA_' + user.id }
			});
			return { message: 'globals.saved' };
		}
	},
	toggleSMTPSSL: async ({ locals: { prisma, user }, request }) => {
		if (!user) redirect(302, '/auth/sign-in');
		if (!['admin', 'root'].includes(user.role)) {
			return fail(403, { message: 'errors.unauthorized' });
		}

		const form = await request.formData();
		const ssl = form.get('ssl')?.toString();

		await prisma.setting.upsert({
			create: {
				field: 'SMTP_SSL',
				id: 'SMTP_SSL',
				userId: null,
				value: ssl === 'true' ? 'true' : 'false'
			},
			update: { value: ssl },
			where: { field: 'SMTP_SSL', id: 'SMTP_SSL', userId: null }
		});
		const settings = await getSettings();
		await settings.updateDB();
		return { message: 'globals.saved' };
	},
	tokenGenerate: async ({ locals: { prisma, user }, request }) => {
		if (!user) redirect(302, '/auth/sign-in');

		const form = await request.formData();
		const ttlValue = Number(form.get('ttlValue')) || 7;
		const ttlUnit = form.get('ttlUnit')?.toString() || 'days';
		const expiresIn = convertTtlToString(ttlValue, ttlUnit) as StringValue;

		await prisma.token.deleteMany({ where: { userId: user.id } });
		const token = createToken(user, expiresIn);
		await prisma.token.create({ data: { key: token, userId: user.id } });
		return { message: 'globals.saved' };
	},
	tokenRevoke: async ({ locals: { prisma, user } }) => {
		if (!user) redirect(302, '/auth/sign-in');
		await prisma.token.deleteMany({ where: { userId: user.id } });
		return { message: 'globals.saved' };
	},
	umami: async (event) => {
		const {
			locals: { prisma, user }
		} = event;
		if (!user) redirect(302, '/auth/sign-in');
		if (!['admin', 'root'].includes(user.role)) {
			redirect(302, '/auth/settings#profile');
		}
		const umamiForm = await superValidate(event, zod(umamiSchema));
		if (!umamiForm.valid) {
			return fail(400, {
				umamiForm
			});
		}
		const settings = await getSettings();
		if (umamiForm.data.url) {
			await prisma.setting.upsert({
				create: {
					field: 'PUBLIC_UMAMI_WEBSITE_URL',
					id: 'PUBLIC_UMAMI_WEBSITE_URL',
					value: umamiForm.data.url
				},
				update: { value: umamiForm.data.url },
				where: { id: 'PUBLIC_UMAMI_WEBSITE_URL' }
			});
		}
		if (umamiForm.data.websiteId) {
			await prisma.setting.upsert({
				create: {
					field: 'PUBLIC_UMAMI_WEBSITE_ID',
					id: 'PUBLIC_UMAMI_WEBSITE_ID',
					value: umamiForm.data.websiteId
				},
				update: { value: umamiForm.data.websiteId },
				where: { id: 'PUBLIC_UMAMI_WEBSITE_ID' }
			});
		}
		await settings.updateDB();

		return { message: 'globals.saved', umamiForm };
	},
	updateSMTP: async (event) => {
		const {
			locals: { user }
		} = event;
		if (!user) redirect(302, '/auth/sign-in');
		if (!['admin', 'root'].includes(user.role)) {
			return fail(403, { message: 'errors.unauthorized' });
		}

		const smtpForm = await superValidate(event, zod(smtpSchema));
		if (!smtpForm.valid) {
			return fail(400, {
				smtpForm
			});
		}
		try {
			const settings = await getSettings();
			for (const [field, _v] of Object.entries(smtpForm.data)) {
				const value = `${field === 'ssl' ? (_v === true ? 'true' : 'false') : _v}`;
				await prisma.setting.upsert({
					create: {
						field: `SMTP_${field.toUpperCase()}`,
						id: `SMTP_${field.toUpperCase()}`,
						value
					},
					update: { value: `${value}` },
					where: { id: `SMTP_${field.toUpperCase()}`, userId: null }
				});
			}
			await settings.updateDB();
			return {
				message: 'globals.saved',
				smtpForm: { ...smtpForm },
				success: true
			};
		} catch (e) {
			if (process.env.LOG_LEVEL === 'debug') log.error(e);
			return fail(500, { message: 'errors.generic', smtpForm });
		}
	},
	vtapi: async (event) => {
		const {
			locals: { prisma, user }
		} = event;
		if (!user) redirect(302, '/auth/sign-in');
		if (!['admin', 'root'].includes(user.role)) {
			redirect(302, '/auth/settings#profile');
		}
		const vtApiForm = await superValidate(event, zod(vtAPISchema));
		if (!vtApiForm.valid) {
			return fail(400, {
				vtApiForm
			});
		}
		const settings = await getSettings();

		if (vtApiForm.data.secret) {
			await prisma.setting.upsert({
				create: {
					field: 'VTAPI_KEY',
					id: 'VTAPI_KEY',
					value: vtApiForm.data.secret
				},
				update: { value: vtApiForm.data.secret },
				where: { id: 'VTAPI_KEY' }
			});
			await settings.updateDB();
		}

		return {
			message: 'globals.saved',
			vtApiForm
		};
	},
	whitelist: async (event) => {
		const {
			locals: { prisma, user }
		} = event;
		if (!user) redirect(302, '/auth/sign-in');
		const whiteListForm = await superValidate(event, zod(whiteListSchema));
		if (!whiteListForm.valid) {
			return fail(400, {
				whiteListForm
			});
		}
		const entity = whiteListForm.data.entity;
		let domain: string | undefined, username: string | undefined;

		switch (true) {
			case /^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/.test(entity):
				[username, domain] = entity.split('@');
				break;

			case entity.includes('.') && entity.includes('@'):
				domain = entity.split('@')[1];
				username = '*';
				break;
			case entity.includes('.') && !entity.includes('@'):
				domain = entity;
				username = undefined;
				break;
			default:
				username = entity;
				domain = undefined;
				break;
		}
		const id =
			domain && username
				? `${domain}:` + `${username}`
				: domain
					? `domain:${domain}`
					: username
						? `username:${username}`
						: undefined;

		if (!id) return fail(500, { message: 'errors.generic' });

		await prisma.watchList.upsert({
			create: { allowed: true, domain, id, username },
			update: { allowed: true, domain, username },
			where: { id }
		});

		return {
			whiteListForm
		};
	}
};

const code = async (theme: string) =>
	await shiki.codeToHtml(
		`const request = await fetch(\`api/\${endpoint}\`, {
		"headers": {
			"Authorization": \`Bearer \${token}\`
		}
	})`,
		{
			lang: 'typescript',
			theme: theme === 'system' || theme === 'dark' ? 'github-dark' : 'github-light'
		}
	);
