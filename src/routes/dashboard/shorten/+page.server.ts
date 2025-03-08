import { redirect } from '@sveltejs/kit';
import { fail } from '@sveltejs/kit';
import { snappSchema } from '$lib/components/snapps/schema';
import { watchLists } from '$lib/server/watchlists/index.js';
import bcrypt from 'bcryptjs';
import { customAlphabet } from 'nanoid';
import { superValidate } from 'sveltekit-superforms';
import { zod } from 'sveltekit-superforms/adapters';

const nanoid = customAlphabet('abcdefghijklmnopqrstuvwxyz', 5);

export const load = async ({ locals: { user } }) => {
	if (!user) redirect(302, '/auth/sign-in');

	return {
		form: await superValidate(zod(snappSchema))
	};
};

export const actions = {
	create: async (event) => {
		const {
			locals: { prisma, user }
		} = event;
		if (!user) redirect(302, '/auth/sign-in');
		const createForm = await superValidate(event, zod(snappSchema));
		if (!createForm.valid) {
			return fail(400, {
				form: createForm
			});
		}

		if (await watchLists.hasExceededSnappLimit(user.id)) {
			return fail(400, {
				form: createForm,
				message: 'errors.snapps.max-snapps'
			});
		}

		const { groups, secret, tags, utmParams, ...snapp } = createForm.data;

		const { errors, valid } = await watchLists.validateURL(snapp.originalUrl);
		const exists = snapp.shortcode
			? await prisma.snapp.count({
					where: { shortcode: { startsWith: snapp.shortcode } }
				})
			: null;

		if (!valid) {
			return fail(400, {
				form: createForm,
				message:
					(errors?.missingUrl && errors.missingUrl) ||
					(errors?.blacklist && errors.blacklist) ||
					(errors?.https && errors.https)
			});
		}

		try {
			const newSnapp = await prisma.snapp.create({
				data: {
					expiresAt: snapp.expiresAt || null,
					groupId: (groups.length && groups[0]) || null,
					maxUsages: snapp.maxUsages || -1,
					notes: snapp.notes || null,
					originalUrl: snapp.originalUrl,
					secret: secret ? await bcrypt.hash(secret, 12) : null,
					shortcode:
						(snapp.shortcode &&
							(exists && exists > 0 ? `${snapp.shortcode}-${exists}` : snapp.shortcode)) ||
						nanoid(5),
					tag: {
						connectOrCreate: tags.map((t) => ({
							create: { name: t, slug: t },
							where: { slug: t }
						}))
					},

					userId: user.id,
					utmParams: JSON.stringify(utmParams)
				}
			});

			return { form: createForm, snapp: newSnapp };
		} catch (error) {
			return fail(500, { form: createForm, message: (error as Error).message });
		}
	}
};
