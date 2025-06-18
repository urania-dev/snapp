import type { SortingState } from '@tanstack/table-core';

import { fail, redirect } from '@sveltejs/kit';
import { tagSchema } from '$lib/components/tags/schema.js';
import { ParamsHandler } from '$lib/server/params/index.js';
import { superValidate } from 'sveltekit-superforms';
import { zod } from 'sveltekit-superforms/adapters';

export const load = async ({ cookies, locals: { prisma, user }, url }) => {
	if (!user) redirect(302, '/auth/sign-in');

	const beParams = new ParamsHandler(url.toString(), cookies, 9, 1);

	const limit = beParams.getLimit();
	beParams.saveLimit(limit);
	const { page, query, sorting } = beParams.getParams();

	const [sort] = JSON.parse(sorting || '[]') as SortingState;
	const tags = await prisma.tag.findMany({
		include: { _count: true },
		orderBy:
			sort && sort.id !== '_count'
				? { [sort.id]: sort.desc ? 'desc' : 'asc' }
				: sort && sort.id === '_count'
					? { snapps: { _count: sort.desc ? 'desc' : 'asc' } }
					: undefined,
		skip: limit * parseInt(page),
		take: limit,
		where: {
			AND: [
				(query && {
					OR: [
						{
							slug: {
								contains: query
							}
						},
						{
							name: {
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
					{}
			]
		}
	});
	const count = await prisma.tag.count({
		orderBy: sort && sort.id !== '_count' ? { [sort.id]: sort.desc ? 'desc' : 'asc' } : undefined,
		where: {
			AND:
				(query === undefined && [
					{
						OR: [
							{
								slug: {
									contains: query
								}
							},
							{
								name: {
									contains: query
								}
							},
							{
								notes: {
									contains: query
								}
							}
						]
					},
					user.role !== 'user' ? {} : { snapps: { every: { userId: user.id } } }
				]) ||
				{}
		}
	});

	return {
		createForm: await superValidate(zod(tagSchema)),
		limit: beParams.getLimit(),
		page,
		pageCount: Math.ceil(count / limit),
		query,
		rowCount: count,
		tags
	};
};

export const actions = {
	create: async (event) => {
		const {
			locals: { prisma, user }
		} = event;
		if (!user) redirect(302, '/auth/sign-in');
		const createForm = await superValidate(event, zod(tagSchema));
		if (!createForm.valid) {
			return fail(400, {
				createForm
			});
		}

		await prisma.tag.upsert({
			create: { ...createForm.data },
			update: { ...createForm.data },
			where: { slug: createForm.data.slug }
		});

		return { createForm };
	},
	delete: async (event) => {
		const {
			locals: { prisma, user },
			request
		} = event;
		if (!user) redirect(302, '/auth/sign-in');

		const form = await request.formData();

		const ids = form.getAll('ids[]') as string[];
		await prisma.tag.deleteMany({ where: { slug: { in: ids } } });
	}
};
