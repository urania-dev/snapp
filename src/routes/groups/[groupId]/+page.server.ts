import type { SortingState } from '@tanstack/table-core';

import { redirect } from '@sveltejs/kit';
import { ParamsHandler } from '$lib/server/params/index.js';

export const load = async ({ cookies, locals: { prisma, user }, params: { groupId }, url }) => {
	if (!user) redirect(302, '/auth/sign-in');
	const group = await prisma.group.findFirst({
		include: {
			_count: true,
			users:
				user.role !== 'user'
					? {
							select: {
								createdAt: true,
								email: true,
								id: true,
								notes: true,
								password: false,
								tfs: false,
								updatedAt: true,
								username: true,
								verified: true
							}
						}
					: undefined
		},
		where: { slug: groupId }
	});
	if (!group) redirect(302, '/groups');
	const beParams = new ParamsHandler(url.toString(), cookies, 9, 1);

	const limit = beParams.getLimit();
	beParams.saveLimit(limit);
	const { page, query, sorting, tag } = beParams.getParams();
	const [sort] = JSON.parse(sorting || '[]') as SortingState;
	const snapps = await prisma.snapp.findMany({
		include: { tag: true },
		orderBy: sort ? { [sort.id]: sort.desc ? 'desc' : 'asc' } : undefined,
		skip: limit * parseInt(page),
		take: limit,
		where: {
			AND: [
				(query && {
					OR: [
						{
							shortcode: {
								contains: query
							}
						},
						{
							originalUrl: {
								contains: query
							}
						},
						{
							notes: {
								contains: query
							}
						}
					]
				}) ||
					{},
				(tag && {
					tag: { some: { slug: tag } }
				}) ||
					{}
			],
			groupId
		}
	});
	const count = await prisma.snapp.count({
		orderBy: sort ? { [sort.id]: sort.desc ? 'desc' : 'asc' } : undefined,
		where: {
			AND:
				query === undefined
					? [{ userId: user.id }]
					: [
							{ userId: user.id },
							{
								OR: [
									{
										shortcode: {
											contains: query
										}
									},
									{
										originalUrl: {
											contains: query
										}
									},
									{
										notes: {
											contains: query
										}
									}
								]
							}
						]
		}
	});

	return {
		group,
		groupId,
		limit: beParams.getLimit(),
		page,
		pageCount: Math.ceil(count / limit),
		query,
		rowCount: count,
		snapps,
		user
	};
};
