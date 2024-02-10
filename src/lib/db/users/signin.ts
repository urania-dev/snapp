import { db, type Database } from '..';
import bcrypt from 'bcrypt';
import SnappError from '../utils/snappError';
import { EntityId } from 'redis-om';

export default async function signin(
	this: Database,
	username: string | undefined,
	password: string | undefined
) {
	if (typeof username !== 'string' || username.trim() === '' || username.length < 3)
		return new SnappError(400, { username: true, message: 'auth:username:unset' });

	if (typeof password !== 'string' || password.trim() === '')
		return new SnappError(400, {
			password: true,
			message: 'auth:password:unset'
		});

	let query = this.users.search().where('username').equals(username);

	if (username?.includes('@')) query.or('email').equals(username);

	const exists = await query.first();

	if (!exists) return new SnappError(404, { message: 'auth:user:not:found', username: true });

	const check_pwd = await bcrypt.compare(password, exists.hash as string);
	const user_id = exists[EntityId];
	if (user_id) await db.users.save(user_id, { ...exists, updated: new Date() });
	
	if (!check_pwd)
		return new SnappError(400, {
			username: true,
			password: true,
			message: 'auth:wrong:credentials'
		});

	return {
		succes: true,
		status: 200,
		username: exists.username,
		password: false
	};
}
