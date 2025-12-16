import { error, redirect } from '@sveltejs/kit';
import { dev } from '$app/environment';
import { command, form, getRequestEvent, query } from '$app/server';
import { getBetterAuth } from '$lib/auth/server';
import { m } from '$lib/paraglide/messages';
import { CONSTANTS } from '$lib/server/const';
import { db } from '$lib/server/db';
import { settings } from '$lib/server/settings';
import { cleanupOrphanFolders } from '$lib/server/utils';
import { slugify } from '$lib/utils';
import { generateRandomString } from 'better-auth/crypto';
import { randomUUID } from 'node:crypto';
import fs from 'node:fs';
import * as v from 'valibot';

import { getHost } from './config.remote';

const regex = /^(?=.*\d)(?=.*[A-Z])(?=.*[a-z])(?=.*[^\w\d])([^\s])+$/;
const PasswordSchema = v.pipe(
	v.string(m.errors_non_empty()),
	v.regex(regex, m.errors_password_invalid())
);
const ForgotPasswordSchema = v.object({
	email: v.pipe(v.string(m.errors_non_empty()), v.email(m.errors_email_invalid()))
});
const ResetPasswordSchema = v.pipe(
	v.object({
		_confirmPassword: PasswordSchema,
		_password: PasswordSchema,
		token: v.pipe(v.string(m.errors_non_empty()))
	}),
	v.forward(
		v.partialCheck(
			[['_password'], ['_confirmPassword']],
			(input) => input._password === input._confirmPassword,
			m.errors_password_unmatch()
		),
		['_confirmPassword']
	)
);
const LoginSchema = v.object({
	_password: v.pipe(v.string(m.errors_non_empty()), v.nonEmpty(m.errors_non_empty())),
	username: v.pipe(v.string(m.errors_non_empty()), v.nonEmpty(m.errors_non_empty()))
});
const RegisterSchema = v.pipeAsync(
	v.objectAsync({
		_confirmPassword: PasswordSchema,
		_password: PasswordSchema,
		email: v.pipeAsync(
			v.string(m.errors_non_empty()),
			v.email(m.errors_email_invalid()),
			v.checkAsync(async (email) => {
				const exists = await db.query.user.findFirst({ where: { email } });
				if (!exists) return true;
				else return false;
			}, m.errors_email_unavailable())
		),
		username: v.pipeAsync(
			v.string(m.errors_non_empty()),
			v.nonEmpty(m.errors_non_empty()),
			v.checkAsync(async (username) => {
				const { url } = getRequestEvent();
				const config = settings.get();
				let origin = url.origin;
				if (dev) origin = origin.replace('http:', 'https:');
				const host = config.hosts.find((h) => h.origin === origin);
				if (!host) return false;
				const auth = await getBetterAuth(host);
				const { available: isUsernameAvailable } = await auth.api.isUsernameAvailable({
					body: {
						username: username
					}
				});
				return isUsernameAvailable;
			}, m.errors_username_unavailable())
		)
	}),
	v.forward(
		v.partialCheck(
			[['_password'], ['_confirmPassword']],
			(input) => input._password === input._confirmPassword,
			m.errors_password_unmatch()
		),
		['_confirmPassword']
	)
);
const ChangePasswordSchema = v.pipeAsync(
	v.objectAsync({
		_confirmPassword: PasswordSchema,
		_newPassword: PasswordSchema,
		_password: PasswordSchema
	}),
	v.forward(
		v.partialCheck(
			[['_newPassword'], ['_confirmPassword']],
			(input) => input._newPassword === input._confirmPassword,
			m.errors_password_unmatch()
		),
		['_newPassword']
	)
);

export const requireUser = query(async () => {
	const {
		locals: { user }
	} = getRequestEvent();
	if (!user) redirect(307, '/auth/sign-in');
	return user;
});

export const login = form(LoginSchema, async (login) => {
	const { request } = getRequestEvent();
	const host = await getHost();
	const auth = await getBetterAuth(host);
	const shouldCheckTOTP = host.options.disable.twoFactor !== true;
	let res: Awaited<ReturnType<typeof auth.api.signInUsername>>;
	try {
		res = await auth.api.signInUsername({
			body: {
				callbackURL: host.origin + '/dashboard',
				password: login._password,
				username: login.username
			},
			headers: request.headers
		});
	} catch (e) {
		if (CONSTANTS.DEBUG) console.error(e);

		const code = (e as { body?: { code?: string } }).body?.code;
		switch (code) {
			case 'INVALID_USERNAME_OR_PASSWORD':
				throw error(400, { message: m.errors_wrong_credentials() });
			case 'EMAIL_NOT_VERIFIED':
				throw error(400, { message: m.verify_your_email() });
			case 'FORBIDDEN':
				throw error(401, { message: m.blacklisted() });
			default:
				throw error(400, { message: m.errors_generic() });
		}
	}
	if (
		shouldCheckTOTP &&
		res?.user !== undefined &&
		'twoFactorEnabled' in res.user &&
		res?.user.twoFactorEnabled !== true
	)
		redirect(307, '/auth/setup-2fa');
	if (res && 'twoFactorRedirect' in res) redirect(307, '/auth/2fa');
	redirect(307, '/dashboard');
});
export const signup = form(RegisterSchema, async ({ _password, email, username }) => {
	const { request } = getRequestEvent();
	const host = await getHost();
	const auth = await getBetterAuth(host);
	try {
		await auth.api.signUpEmail({
			body: {
				callbackURL: host.origin + '/dashboard',
				email,
				name: username,
				password: _password,
				username
			},
			headers: request.headers
		});
	} catch (err) {
		if (CONSTANTS.DEBUG) console.error('[debug] signup error', err);
		throw error(400, { message: m.auth_sign_up_disabled() });
	}
	return true;
});
export const forgotPassword = form(ForgotPasswordSchema, async ({ email }) => {
	const { request } = getRequestEvent();
	const host = await getHost();
	const auth = await getBetterAuth(host);
	try {
		await auth.api.requestPasswordReset({
			body: {
				email,
				redirectTo: '/auth/reset-password'
			},
			headers: request.headers
		});
	} catch (err) {
		if (CONSTANTS.DEBUG) console.error('[debug] reset password error', err);
		return false;
	}
	return true;
});
export const resetPassword = form(ResetPasswordSchema, async ({ _password, token }) => {
	const { request } = getRequestEvent();
	const host = await getHost();
	const auth = await getBetterAuth(host);
	try {
		await auth.api.resetPassword({
			body: {
				newPassword: _password,
				token
			},
			headers: request.headers
		});
	} catch (err) {
		if (CONSTANTS.DEBUG) console.error('[debug] reset password error', err);
		return false;
	}
	redirect(302, '/dashboard');
});



export const saveAvatar = command(v.string(), async (file) => {
	const user = await requireUser();
	const directory = `config/avatars/${user.id}`;
	const base64 = file.replace(/^data:image\/\w+;base64,/, '');
	const buffer = Buffer.from(base64, 'base64');

	fs.rmSync(directory, { force: true, recursive: true });
	fs.mkdirSync(directory, { recursive: true });

	const filenameWithExt = `${randomUUID()}.webp`;
	const filename = `${directory}/${filenameWithExt}`;

	fs.writeFileSync(filename, buffer);

	cleanupOrphanFolders('config/avatars');

	return { filename: `/avatars/${filenameWithExt}` };
});

export const updateProfileNotes = form(v.object({ notes: v.string() }), async ({ notes }) => {
	const { request } = getRequestEvent();
	const host = await getHost();
	const auth = await getBetterAuth(host);
	try {
		await auth.api.updateUser({
			body: {
				notes
			},
			headers: request.headers
		});
	} catch (err) {
		if (CONSTANTS.DEBUG) console.error('[debug] update profile notes error', err);
		return false;
	}
	return true;
});
export const updateProfile = form(
	v.object({ username: v.pipe(v.string(m.errors_non_empty()), v.nonEmpty(m.errors_non_empty())) }),
	async ({ username }) => {
		const { request } = getRequestEvent();
		const host = await getHost();
		const auth = await getBetterAuth(host);
		try {
			await auth.api.updateUser({
				body: {
					username
				},
				headers: request.headers
			});
		} catch (err) {
			if (CONSTANTS.DEBUG) console.error('[debug] update profile notes error', err);
			return false;
		}
		return true;
	}
);
export const changePassword = form(ChangePasswordSchema, async ({ _newPassword, _password }) => {
	const { request } = getRequestEvent();
	const host = await getHost();
	const auth = await getBetterAuth(host);
	try {
		await auth.api.changePassword({
			body: {
				currentPassword: _password,
				newPassword: _newPassword,
				revokeOtherSessions: false
			},
			headers: request.headers
		});
	} catch (err) {
		if (CONSTANTS.DEBUG) console.error('[debug] update password error', err);
		throw error(400, {
			message:
				(err as { body?: { code?: string } })?.body?.code === 'INVALID_PASSWORD'
					? m.errors_wrong_credentials()
					: m.errors_saving_profile()
		});
	}
	return true;
});
export const fetchTotp = form(v.object({ _password: PasswordSchema }), async ({ _password }) => {
	const { request } = getRequestEvent();
	const host = await getHost();
	const auth = await getBetterAuth(host);
	const config = settings.get();
	try {
		return await auth.api.enableTwoFactor({
			body: {
				issuer: config.appname,
				password: _password
			},
			headers: request.headers
		});
	} catch (err) {
		if (CONSTANTS.DEBUG) console.error('[debug] update password error', err);
		throw error(400, {
			message:
				(err as { body?: { code?: string } })?.body?.code === 'INVALID_PASSWORD'
					? m.errors_wrong_credentials()
					: m.errors_saving_profile()
		});
	}
});
export const disableTotp = form(v.object({ _password: PasswordSchema }), async ({ _password }) => {
	const { request } = getRequestEvent();
	const host = await getHost();
	const auth = await getBetterAuth(host);
	try {
		await auth.api.disableTwoFactor({
			body: {
				password: _password
			},
			headers: request.headers
		});
	} catch (err) {
		if (CONSTANTS.DEBUG) console.error('[debug] update password error', err);
		throw error(400, {
			message:
				(err as { body?: { code?: string } })?.body?.code === 'INVALID_PASSWORD'
					? m.errors_wrong_credentials()
					: m.errors_saving_profile()
		});
	}
});
export const deleteUser = form(async () => {
	const { request } = getRequestEvent();
	const host = await getHost();
	const auth = await getBetterAuth(host);
	try {
		await auth.api.deleteUser({
			body: {
				callbackURL: '/'
			},
			headers: request.headers
		});
	} catch (err) {
		if (CONSTANTS.DEBUG) console.error('[debug] delete user error', err);
		throw error(400, {
			message: (err as { body?: { code?: string } })?.body?.code || m.errors_saving_profile()
		});
	}
});
export const getAccounts = query(async () => {
	const { request } = getRequestEvent();
	const host = await getHost();
	const auth = await getBetterAuth(host);
	try {
		const accounts = await auth.api.listUserAccounts({ headers: request.headers });
		return accounts;
	} catch (error) {
		if (CONSTANTS.DEBUG) console.error(error);

		return [];
	}
});

const InviteUserSchema = v.pipeAsync(
	v.objectAsync({
		email: v.pipeAsync(
			v.string(m.errors_non_empty()),
			v.email(m.errors_email_invalid()),
			v.checkAsync(async (email) => {
				const exists = await db.query.user.findFirst({ where: { email } });
				if (!exists) return true;
				else return false;
			}, m.errors_email_unavailable())
		),
		role: v.union([v.literal('admin'), v.literal('user')])
	})
);

export const inviteUser = form(InviteUserSchema, async (invitee) => {
	const { request } = getRequestEvent();
	const host = await getHost();
	const auth = await getBetterAuth(host);
	try {
		const { user } = await auth.api.createUser({
			body: {
				data: {
					emailVerified: true,
					username: invitee.email
				},
				email: invitee.email,
				name: invitee.email,
				password: generateRandomString(12),
				role: invitee.role
			},
			headers: request.headers
		});
		await auth.api.requestPasswordReset({
			body: {
				email: user.email,
				redirectTo: '/auth/complete-registration'
			},
			headers: {} // anonymous
		});

		await auth.api.addMember({
			body: {
				organizationId: slugify(host.origin),
				role: invitee.role === 'admin' ? 'admin' : 'member',
				userId: user.id
			},
			headers: request.headers
		});
		return true;
	} catch (err) {
		if (CONSTANTS.DEBUG) console.error('[debug] invite user error', err);
		throw error(400, {
			message: (err as { body?: { code?: string } })?.body?.code || m.errors_saving_profile()
		});
	}
});

export const deleteUsers = command(v.array(v.string()), async (ids) => {
	await requireUser();
	const { request } = getRequestEvent();
	const host = await getHost();
	try {
		const auth = await getBetterAuth(host);
		await Promise.all(
			ids.map(async (id) => auth.api.removeUser({ body: { userId: id }, headers: request.headers }))
		);
		return true;
	} catch (err) {
		if (CONSTANTS.DEBUG) console.error(err);
		if ((err as { body?: { code: string } })?.body?.code === 'YOU_CANNOT_REMOVE_YOURSELF')
			throw error(400, { message: m.errors_cannot_remove_yourself() });
		return false;
	}
});

export const hasPermission = query(
	v.object({
		context: v.string(),
		organizationId: v.string(),
		permissions: v.array(
			v.union([
				v.literal('create'),
				v.literal('read'),
				v.literal('delete'),
				v.literal('update'),
				v.literal('cancel')
			])
		)
	}),
	async ({ context, organizationId, permissions }) => {
		await requireUser();
		const { request } = getRequestEvent();
		const host = await getHost();
		if (!host) throw error(400, { message: m.errors_unrecognized_host() });
		const auth = await getBetterAuth(host);

		try {
			const res = await auth.api.hasPermission({
				body: {
					organizationId,
					permissions: {
						[context]: permissions
					}
				},
				headers: request.headers
			});
			console.log({ [context]: permissions }, res);
			return res.success;
		} catch (err) {
			if (CONSTANTS.DEBUG) console.error(err);

			return false;
		}
	}
);
