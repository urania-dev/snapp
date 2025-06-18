import type { SortingState } from '@tanstack/table-core';

import { fail, redirect } from '@sveltejs/kit';
import { createPasswordResetToken } from '$lib/server/auth/index.js';
import { getSettings } from '$lib/server/config/index.js';
import ForgotPasswordEmail from '$lib/server/emails/auth/forgotPasswordEmail.svelte';
import { ParamsHandler } from '$lib/server/params/index.js';
import { sendEmail } from '$lib/server/smtp/index.js';

export const load = async ({ cookies, locals: { prisma, user }, params: { username }, url }) => {
	if (!user) redirect(302, '/auth/sign-in');
	if (user.role === 'user') redirect(302, '/dashbord');

	const profile = await prisma.user.findFirst({ where: { username } });
	if (!profile) redirect(302, '/users');
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
				{ user: { username } },
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
			AND: [{ user: { username } }]
		}
	});

	return {
		limit: beParams.getLimit(),
		page,
		pageCount: Math.ceil(count / limit),
		profile,
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
			params: { username },
			request
		} = event;
		if (!user) redirect(302, '/auth/sign-in');
		if (user.role === 'user') {
			return fail(401, { message: 'errors.unauthorized' });
		}
		const form = await request.formData();

		const ids = form.getAll('ids[]') as string[];

		await prisma.snapp.deleteMany({ where: { id: { in: ids }, user: { username } } });
	},
	'reset-mfa': async (event) => {
		if (!event.locals.user) redirect(302, '/auth/sign-in');
		if (event.locals.user.role === 'user') return fail(401, { message: 'errors.unauthorized' });

		const form = await event.request.formData();
		const id = form.get('id')?.toString() || null;
		if (!id) return fail(400, { message: 'errors.user-not-found' });
		await event.locals.prisma.user.update({ data: { tfs: null }, where: { id } });
		return { message: 'globals.saved' };
	},
	'reset-password': async (event) => {
		if (!event.locals.user) redirect(302, '/auth/sign-in');
		if (event.locals.user.role === 'user') return fail(401, { message: 'errors.unauthorized' });
		const form = await event.request.formData();
		const id = form.get('id')?.toString() || null;
		const email = form.get('email')?.toString() || null;
		if (!id) return fail(400, { message: 'errors.user-not-found' });
		if (!email) return fail(400, { message: 'errors.user-not-found' });
		const settings = await getSettings();
		const { tokenHash } = await createPasswordResetToken(id);
		const recoveryURL = `${event.url.origin}/auth/recover-password?token=${tokenHash}`;
		const appname = settings.get<string>('appname') || 'Snapp';
		const ip = event.request.headers.get('X-FORWARDED-FOR') || '[no ip traceable.]';

		await sendEmail(
			ForgotPasswordEmail,
			{ appname, ip, recoveryURL },
			email,
			appname + ' | Requested reset password'
		);
		return { message: 'globals.saved' };
	},
	'set-role': async (event) => {
		if (!event.locals.user) redirect(302, '/auth/sign-in');
		if (event.locals.user.role === 'user') return fail(401, { message: 'errors.unauthorized' });

		const form = await event.request.formData();
		const id = form.get('id')?.toString() || null;
		const role = form.get('role')?.toString() || null;
		if (!id) return fail(400, { message: 'errors.user-not-found' });
		if (!role || role === 'root') return fail(400, { message: 'errors.user-not-found' });

		await event.locals.prisma.user.update({ data: { role }, where: { id } });
		return { message: 'globals.saved' };
	}
};
