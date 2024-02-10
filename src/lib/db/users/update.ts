import { db, type Database } from '..';
import bcrypt from 'bcrypt';
import SnappError from '../utils/snappError';

export default async function updateProfile(
	this: Database,
	{
		id,
		username,
		email,
		password,
		settings,
		roles
	}: {
		id?: string;
		email?: string | undefined;
		username?: string | undefined;
		password?: string | undefined;
		settings?: DBUser['settings'];
		roles?: string[];
	}
) {
	if (!id) return new SnappError(400, { message: 'api:user:id:unset' });
	let updatedProfile = (await this.users.search().where('id').equal(id).first()) as DBUser;

	if (!updatedProfile) return new SnappError(404, { message: 'auth:user:not:found' });

	if (email && email.trim() !== '' && /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/.test(email) === true)
		updatedProfile.email = email;

	if (password) {
		if (
			/^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$%^&\_\,*-]).{8,}$/.test(password) === false
		)
			return new SnappError(400, {
				password: true,
				message: 'auth:password:guidelines'
			});

		const hash = await bcrypt
			.genSalt(10)
			.then((salt) => bcrypt.hash(password as string, salt))
			.then((hash) => hash);

		updatedProfile.hash = hash;
	}

	if (username) {
		const exists = await db.users
			.search()
			.where('username')
			.equals(username)
			.and('id')
			.does.not.equals(id)
			.first();
		if (exists) return new SnappError(400, { message: 'auth:username:taken' });
		updatedProfile.username = username;
	}

	if (settings)
		updatedProfile.settings = {
			...updatedProfile.settings,
			theme: settings?.theme ?? updatedProfile.settings?.theme,
			lang: settings?.lang ?? updatedProfile.settings?.lang ?? 'en'
		};

	if (roles && roles.length > 0) {
		const newRoles = new Set([...roles]);
		console.log(Array.from(newRoles), updatedProfile.roles)
		if (
			Array.from(newRoles) !== updatedProfile.roles &&
			updatedProfile.roles.includes('superadmin') &&
			!Array.from(newRoles).includes('superadmin')
		)
			return new SnappError(401, { message: 'global:super:admin:protects' });
		updatedProfile.roles = Array.from(newRoles);
	}

	try {
		updatedProfile.updated = new Date();
		await this.users.save(id, { ...updatedProfile, updated: new Date() });

		return {
			status: 200,
			success: true,
			message: 'auth:profile:saved',
			user: JSON.parse(JSON.stringify(updatedProfile))
		};
	} catch (error) {
		return new SnappError(500, { ...(error as object) });
	}
}
