import { db, type Database } from '..';
import SnappError from '../utils/snappError';

export default async function authorship(this: Database, { id, user_id }: Partial<DBSnapp>) {
	if (!user_id) return new SnappError(400, { message: 'api:user:id:unset' });
	if (!id) return new SnappError(400, { message: 'api:snapp:id:unset' });

	const roles = ((await db.users.search().where('id').equal(user_id).first()) as DBUser)?.roles;

	const is_admin = roles.includes('admin') || roles.includes('superadmin');

	const query = this.snapps.search().where('id').equals(id);

	if (!is_admin) query.and('user_id').equals(user_id);

	const is_author = (await query.first()) as DBSnapp | null;

	return {
		status: 200,
		is_author: is_author !== null,
		can_edit: is_author !== null || is_admin === true || false
	};
}
