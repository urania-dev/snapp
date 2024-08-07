import { prisma } from '$lib/server/prisma';

export const delete_watchlist = async (id: string) => {
	await prisma.watchlist.delete({ where: { id } });
};
