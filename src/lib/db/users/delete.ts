import type { Database } from '..';
import SnappError from '../utils/snappError';

export default async function deleteProfile(this: Database, ...ids: string[]) {
	if (!ids) return new SnappError(400, { message: 'api:user:id:unset' });
	const errors = await Promise.all(
		ids.map(async (id) => {
			let user_to_delete = (await this.users.search().where('id').equal(id).first()) as DBUser;

			if (!user_to_delete) return new SnappError(404, { message: 'auth:user:not:found' });

			if (user_to_delete.roles.includes('superadmin'))
				return new SnappError(401, { message: 'super:admin:protects' });
			else return false;
		})
	);

	let error_IDX: number | undefined = undefined;
	const someError = errors.some((err, idx) => {
		if (err !== false) {
			error_IDX = idx;
			return true;
		}
		return false;
	});

	if (someError) return errors[error_IDX!] as SnappError;

	try {
		return {
			status: 200,
			success: true,
			message: 'auth:profile:deleted'
		};
	} catch (error) {
		return new SnappError(500, { error, message: 'global:system:error' });
	}
}
