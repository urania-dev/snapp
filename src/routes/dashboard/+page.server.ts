import type { SortingState } from '@tanstack/table-core';

import { fail, redirect } from '@sveltejs/kit';
import { log } from '$lib/server/log';
import { ParamsHandler } from '$lib/server/params/index.js';

export const load = async ({ cookies, locals: { prisma, user }, url }) => {
	if (!user) redirect(302, '/auth/sign-in');

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
				{ userId: user.id },
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
			]
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
		limit: beParams.getLimit(),
		page,
		pageCount: Math.ceil(count / limit),
		query,
		rowCount: count,
		snapps,
		user
	};
};

export const actions = {
	delete: async (event) => {
		const {
			locals: { prisma, user },
			request
		} = event;
		if (!user) redirect(302, '/auth/sign-in');

		const form = await request.formData();

		const ids = form.getAll('ids[]') as string[];

		try {
			await prisma.snapp.deleteMany({
				where: { id: { in: ids }, userId: user.role !== 'user' ? user.id : undefined }
			});
		} catch (error) {
			if (process.env.LOG_LEVEL === 'debug') log.info(error);
			return fail(400, { message: 'errors.generic' });
		}

		return { message: 'globals.deleted' };
	}
};
