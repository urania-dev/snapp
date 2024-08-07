import { prisma } from '$lib/server/prisma';
import { SNAPP_NOT_FOUND } from '$lib/utils/constants';
import { database } from '../database';

export const delete_snapp = async (userId: string, ...ids: string[]) => {
	const is_admin = await database.users.is_admin(userId);

	const { count } = await prisma.snapp.deleteMany({
		where: {
			id: { in: ids },
			userId: is_admin ? undefined : userId
		}
	});

	if (count === 0) return [0, SNAPP_NOT_FOUND] as [number, string];

	return [count, null] as [number, null];
};
