import { db, type Database } from '..';
import { randomUUID } from 'node:crypto';
import bcrypt from 'bcrypt';
import SnappError from '../utils/snappError';

export default async function (
	this: Database,
	{
		username,
		password,
		email,
		confirmPassword
	}: {
		username: string | undefined;
		email: string | undefined;
		password: string | undefined;
		confirmPassword: string | undefined;
	}
) {
	const enabled_signup = await this.getSetting('settings:app:signup:enabled').then(
		(res) => (res && res === 'true') || false
	);

	if (enabled_signup === false)
		return new SnappError(500, {
			message: 'auth:sign:up:disabled',
			username: false,
			password: false
		});

	if (typeof username !== 'string' || username.trim() === '' || username.length < 3)
		return new SnappError(400, { message: 'auth:username:unset', username: true });

	if (typeof email !== 'string' || email.trim() === '' || email.length < 3)
		return new SnappError(400, { message: 'auth:email:unset', email: true });

	if (typeof password !== 'string' || password.trim() === '')
		return new SnappError(400, { message: 'auth:password:unset', password: true });
	if (/^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$%^&\_\,*-]).{8,}$/.test(password) === false)
		return new SnappError(400, {
			password: true,
			message: 'auth:password:guidelines'
		});

	const has_blacklisted_username = await db.blacklisted({ username });
	if (has_blacklisted_username) return new SnappError(401, { message: 'auth:in:blacklist' });

	const has_whitelists = await db.hasWhiteList();

	if (email && /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/.test(email) === false) {
		return new SnappError(400, {
			email: true,
			message: 'auth:email:invalid'
		});
	}

	const exists_email = await db.users.search().where('email').equals(email).first();

	if (exists_email) return new SnappError(400, { message: 'auth:email:exists' });

	if (has_whitelists === true) {
		const blacklist = await db.blacklistedEmail(email);
		const whitelist = await db.whitelisted(email);
		if (!whitelist.provider && !whitelist.email)
			return new SnappError(401, { message: 'auth:not:in:whitelist' });
		else if (blacklist.provider === true && whitelist.email === false)
			return new SnappError(401, { message: 'auth:in:blacklist' });
		else if (blacklist.email === true) return new SnappError(401, { message: 'auth:in:blacklist' });
	} else {
		const blacklist = await db.blacklistedEmail(email);
		if (blacklist.provider || blacklist.email)
			return new SnappError(401, { message: 'auth:in:blacklist' });
	}

	let user = await this.users
		.search()
		.where('username')
		.equal(username as string)
		.first();

	if (user) return new SnappError(401, { message: 'auth:username:taken', user: true });

	if (!confirmPassword)
		return new SnappError(401, { message: 'auth:password:unmatch', confirmPassword: true });

	if (password !== confirmPassword)
		return new SnappError(400, {
			message: 'auth:password:unmatch',
			password: true,
			confirmPassword: true
		});

	try {
		const hash = await bcrypt
			.genSalt(10)
			.then((salt) => bcrypt.hash(password as string, salt))
			.then((hash) => hash);

		const newUser = {
			id: randomUUID(),
			username: username as string,
			hash: hash,
			email: email,
			roles: ['user'] as string[],
			created: new Date(),
			updated: new Date()
		};

		const admins = await this.users
			.search()
			.where('roles')
			.containsOneOf('admin', 'superadmin')
			.first();

		if (!admins) newUser.roles = ['admin', 'superadmin', ...newUser.roles];

		user = await this.users.save(newUser.id, newUser);

		return {
			success: true,
			status: 200,
			user: {
				id: user.id,
				email: user.email,
				username: user.username
			} as DBUser
		};
	} catch (error) {
		return new SnappError(500, { ...(error as object) });
	}
}
