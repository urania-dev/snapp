import { prisma } from '$lib/server/prisma';

export const get_snapp = async (
	userId?: string,
	query?: string,
	limit: number = 10,
	offset: number = 0,
	orderBy: { [key: string]: 'asc' | 'desc' } | undefined = undefined
) => {
	await prisma.snapp.deleteMany({ where: { expiration: { lte: new Date() } } });
	const snapps = await prisma.snapp
		.findMany({
			where: {
				AND: [
					{ userId },
					{
						OR: query
							? [
								{
									shortcode: {
										contains: query
									}
								},
								{
									original_url: {
										contains: query
									}
								}
							]
							: undefined
					}
				]
			},
			take: limit,
			skip: offset,
			orderBy: orderBy,
			include: {
				tags: { select: { id: true, name: true, slug: true, _count: true } }
			}
		})
		.then((res) =>
			res.map((item) => {
				if (item.secret !== null) {
					item.secret = 'this-snapp-has-secret';
				}
				return item;
			})
		);

	const count = await prisma.snapp.count();

	return [snapps, count] as [typeof snapps, number];
};
