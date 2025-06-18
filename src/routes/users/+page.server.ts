import type { SortingState } from '@tanstack/table-core';

import { fail, redirect } from '@sveltejs/kit';
import { createUserSchema } from '$lib/components/auth/schema.js';
import { createPasswordResetToken } from '$lib/server/auth';
import { getSettings } from '$lib/server/config';
import InvitationEmail from '$lib/server/emails/invitationEmail.svelte'
import { ParamsHandler } from '$lib/server/params/index.js';
import { sendEmail } from '$lib/server/smtp';
import { superValidate } from 'sveltekit-superforms';
import { zod } from 'sveltekit-superforms/adapters';

export const load = async ({ cookies, locals: { prisma, user }, url }) => {
	if (!user) redirect(302, '/auth/sign-in');

	const beParams = new ParamsHandler(url.toString(), cookies, 9, 1);

	const limit = beParams.getLimit();
	beParams.saveLimit(limit);
	const { group, page, query, sorting } = beParams.getParams();
	const [sort] = JSON.parse(sorting || '[]') as SortingState;
	const users = await prisma.user.findMany({
		include: { groups: true },
		orderBy: sort ? { [sort.id]: sort.desc ? 'desc' : 'asc' } : undefined,
		skip: limit * parseInt(page),
		take: limit,
		where: {
			AND: [
				(query && {
					OR: [
						{
							username: {
								contains: query
							}
						},
						{
							email: {
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
				(group && {
					groups: { some: { slug: group } }
				}) ||
					{}
			]
		}
	});
	const count = await prisma.user.count({
		orderBy: sort ? { [sort.id]: sort.desc ? 'desc' : 'asc' } : undefined,
		skip: limit * parseInt(page),
		take: limit,
		where: {
			AND: [
				(query && {
					OR: [
						{
							username: {
								contains: query
							}
						},
						{
							email: {
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

	return {
		createForm: await superValidate(zod(createUserSchema)),
		limit: beParams.getLimit(),
		page,
		pageCount: Math.ceil(count / limit),
		query,
		rowCount: count,
		users
	};
};

export const actions = {
	create: async (event) => {
		const {
			locals: { prisma, user }
		} = event;
		if (!user) redirect(302, '/auth/sign-in');
		const form = await superValidate(event, zod(createUserSchema));
		if (!form.valid) {
			return fail(400, {
				form
			});
		}

		const password = `#!placeholder-meanwhile-user-confirm!@`;
		const guest = await prisma.user.create({ data: { ...form.data, password } });

		const settings = await getSettings();

		const { tokenHash } = await createPasswordResetToken(guest.id);
			const recoveryURL = `${event.url.origin}/auth/recover-password?token=${tokenHash}`;
			const appname = settings.get<string>('appname') || 'Snapp';

			sendEmail(
				InvitationEmail,
				{ appname, recoveryURL },
				guest.email,
				appname + ' | You have been invited'
			);
		return { form };
	},
	delete: async (event) => {
		const {
			locals: { prisma, user },
			request
		} = event;
		if (!user) redirect(302, '/auth/sign-in');
		if (user.role === 'user') {
			return fail(401, { message: 'errors.unauthorized' });
		}

		const form = await request.formData();
		const ids = form.getAll('ids[]') as string[];

		await prisma.snapp.deleteMany({ where: { userId: { in: ids } } });
		await prisma.user.deleteMany({ where: { id: { in: ids } } });
	}
};
