import { redirect } from '@sveltejs/kit';
import { fail } from '@sveltejs/kit';
import { snappSchema } from '$lib/components/snapps/schema';
import { watchLists } from '$lib/server/watchlists/index.js';
import bcrypt from 'bcryptjs';
import { customAlphabet } from 'nanoid';
import { superValidate } from 'sveltekit-superforms';
import { zod } from 'sveltekit-superforms/adapters';
import { env } from '$env/dynamic/public';
import { log } from '$lib/server/log/index.js';

const nanoid = customAlphabet('abcdefghijklmnopqrstuvwxyz', 5);

export const load = async ({ locals: { prisma, user }, params: { id } }) => {
	if (!user) redirect(302, '/auth/sign-in');

	const snapp = await prisma.snapp.findFirst({
		include: { tag: true },
		where: { id }
	});

	if (!snapp) redirect(302, '/dashboard');
	if (snapp.userId !== user.id && user.role !== 'user') redirect(302, '/dashboard');
	return {
		form: await superValidate(
			{
				expiresAt: snapp.expiresAt?.toISOString(),
				groups: (snapp.groupId && [snapp.groupId]) || [],
				maxUsages: snapp.maxUsages,
				notes: snapp.notes || undefined,
				originalUrl: snapp.originalUrl,
				secret: snapp.secret || undefined,
				shortcode: snapp.shortcode,
				tags: snapp.tag.map((t) => t.slug),
				utmParams: JSON.parse(snapp.utmParams || '[]')
			},
			zod(snappSchema)
		),
		snapp,
		user
	};
};

export const actions = {
	edit: async (event) => {
		const {
			locals: { prisma, user }
		} = event;
		if (!user) redirect(302, '/auth/sign-in');
		const editForm = await superValidate(event, zod(snappSchema));

		if (!editForm.valid) {
			return fail(400, {
				form: editForm
			});
		}

		const { groups, secret, tags, utmParams, ...snapp } = editForm.data;

		const originalURL = snapp.originalUrl

		const { errors, valid } = await watchLists.validateURL(originalURL);

		const exists = snapp.shortcode
			? await prisma.snapp.count({
					where: {
						id: { not: event.params.id },
						shortcode: { startsWith: snapp.shortcode.toLowerCase() }
					}
				})
			: null;
		const old = snapp.shortcode
			? await prisma.snapp.findFirst({
					where: {
						id: event.params.id
					}
				})
			: null;

		const isOwnerOrAdmin = old?.id === event.locals.user?.id || event.locals.user?.role !== 'user';
		if (!valid) {
			return fail(400, {
				form: editForm,
				message:
					(errors?.missingUrl && errors.missingUrl) ||
					(errors?.blacklist && errors.blacklist) ||
					(errors?.https && errors.https)
			});
		}
		const EXTRA_GROUPS_EDITABLE  = env?.PUBLIC_EXTRA_GROUPS_EDITABLE?.toString()?.toLowerCase() === 'true'

		if (!isOwnerOrAdmin && !EXTRA_GROUPS_EDITABLE ) return fail(400, { message: 'errors.unauthorized',editForm });
		try {
			const updatedSnapp = await prisma.snapp.update({
				data: {
					userId:old?.userId,
					expiresAt: snapp.expiresAt || null,
					groupId: (groups.length && groups[0]) || null,
					maxUsages: snapp.maxUsages || -1,
					notes: snapp.notes || null,
					originalUrl: originalURL,
					secret: secret
						? old && secret !== old.secret
							? await bcrypt.hash(secret, 12)
							: old?.secret
						: null,
					shortcode:
						(snapp.shortcode &&
							(exists && exists > 0 ? `${snapp.shortcode}-${exists}` : snapp.shortcode)) ||
						nanoid(5),
					tag: tags?.length
						? {
								connectOrCreate: tags.map((t) => ({
									create: { name: t, slug: t },
									where: { slug: t }
								}))
							}
						: undefined,
					utmParams: JSON.stringify(utmParams)
				},
				where: {
					id: event.params.id
				}
			});

			return { form: editForm, snapp: updatedSnapp };
		} catch (error) {
			return fail(500, { form: editForm, message: (error as Error).message });
		}
	}
};
