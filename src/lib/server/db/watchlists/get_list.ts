import { prisma } from '$lib/server/prisma';

export const get_list = async (
	allowed?: boolean,
	limit: number = 10,
	offset: number = 0,
	username?: string | object,
	domain?: string | object
) => {
	return await prisma.watchlist.findMany({
		where: { allowed, domain, username },
		take: limit,
		skip: offset
	});
};
