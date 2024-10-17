import { prisma } from '$lib/server/prisma';

export const get_one = async (username?: string, email?: string) => {
	const user = await prisma.user.findFirst({ where: { OR: [{ username }, { email }] } });

	return [user, user?.username === username || null, user?.email === email || null] as [
		User | null,
		boolean,
		boolean
	];
};
