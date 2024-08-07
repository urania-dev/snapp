import { prisma } from '$lib/server/prisma';

export const check_token = async (secret: string) => {
	const token = await prisma.token.findFirst({
		where: { key: secret },
		include: { user: { select: { role: true } } }
	});

	return token;
};
