import { db, type Database } from '..';
import SnappError from '../utils/snappError';

export default async function admin(this: Database, id: string) {
	const user = (await db.users.search().where('id').equal(id).first()) as DBUser;
	if (!user) return new SnappError(404, { message: 'auth:user:not:found' });

	const is_admin = user.roles.includes('admin') || user.roles.includes('superadmin');
	return is_admin;
}
