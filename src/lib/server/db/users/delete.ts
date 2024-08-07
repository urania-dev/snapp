import { prisma } from '$lib/server/prisma';
import { database } from '../database';

export const delete_user = async (
	id?: string | null,
	username?: string,
	email?: string,
	roles: ('admin' | 'root' | 'user')[] = ['admin', 'root']
) => {
	if (!id) {
		const [{ id: existingId }] = await database.users.one(username, email);
		return await prisma.user.delete({
			where: { id: id ?? existingId, role: { not: { in: roles } } }
		});
	} else return await prisma.user.delete({ where: { id } });
};
