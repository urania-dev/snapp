import { prisma } from '$lib/server/prisma';
import { SNAPP_NOT_FOUND } from '$lib/utils/constants';

export const get_one_snapp = async (shortcode: string) => {
	const snapp = await prisma.snapp.findFirst({ where: { shortcode }, include: { tags: true } });
	if (!snapp) return [null, SNAPP_NOT_FOUND] as [null, string];

	return [snapp, null] as [typeof snapp, null];
};
