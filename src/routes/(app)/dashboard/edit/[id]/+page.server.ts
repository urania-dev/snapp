import { error, fail, redirect } from '@sveltejs/kit';
import { generateRandomString } from '$lib/utils/generateRandomString.js';
import { prisma } from '$lib/server/prisma.js';
import type { Snapp } from '@prisma/client';
import bcrypt from 'bcrypt';
import { slugify } from '$lib/utils/slugify.js';
export async function load({ locals: { auth }, params: { id } }) {
	const session = await auth.validate();
	if (!session) throw redirect(302, '/');

	const snapp = await prisma.snapp.findUnique({ where: { id } });
	if (snapp === null) throw error(404, { message: 'Not found' });
	return { snapp };
}

export const actions = {
	default: async ({ request, locals, params: { id } }) => {
		const session = await locals.auth.validate();
		if (session === null) throw redirect(302, '/');
		const form = await request.formData();
		const original_url = form.get('original-url') as string | null;
		let short_code = form.get('short-code') as string | null;
		const expiration = form.get('expiration') as string | null;
		const secret = form.get('secret') as string | null;

		async function check_short_code(id: string, slug: string) {
			const exists = await prisma.snapp.findMany({
				where: { short_code: { startsWith: slug }, id: { notIn: [id] } },
				select: { _count: true }
			});
			if (exists.length > 0) return `${slug}-${exists.length}`;
			else return slug;
		}

		const snapp = await prisma.snapp.findUnique({ where: { id } });

		if (original_url === null || original_url.trim() === '')
			return fail(400, {
				secret: false,
				original_url: true,
				message: 'Original url must be set'
			});

		if (typeof short_code !== 'string' || short_code.length < 1 || short_code.length > 255) {
			short_code = generateRandomString(5);
		} else short_code = await check_short_code(id, slugify(short_code));
		let edited: Snapp;
		let hashed = secret ? await bcrypt.hash(secret, 12) : undefined;
		let data = {
			original_url,
			short_code,
			has_secret: secret && secret.trim() !== '' ? true : snapp?.secret ? true : false,
			secret: hashed ?? snapp?.secret,
			expires_at: expiration !== null ? new Date(expiration) : null,
			user_id: session.user.userId
		};

		try {
			edited = await prisma.snapp.update({
				where: { id },
				data
			});
		} catch (error) {
			return fail(500, {
				secret: false,
				original_url: false,
				message: (error as unknown as Error).message
			});
		}
		// redirect to
		// make sure you don't throw inside a try/catch block!
		if (edited) throw redirect(302, '/dashboard');
		else
			return fail(500, {
				secret: false,
				original_url: false,
				message: 'An error occurred.'
			});
	}
};
