import { prisma } from '$lib/server/prisma';

const get_setting = async (field: string, userId?: string) => {
	const id = `${field}${(userId && ':' + userId) || ''}`;
	return await prisma.setting.findFirst({ where: { id } });
};

export { get_setting };
