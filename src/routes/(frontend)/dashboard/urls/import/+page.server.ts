import { db } from '$lib/db/index.js';
import jsonify from '$lib/utils/jsonify/index.js';
import { fail, redirect } from '@sveltejs/kit';
import { randomUUID } from 'crypto';
import { existsSync } from 'fs';

export async function load({ locals }) {
	const session = await locals.getSession();
	if (!session) redirect(302, '/');
	const is_admin = await db.admin(session.user.id);

	const user = await db.users.search().where('id').equalTo(session.user.id).first();
	const users = is_admin
		? await db.users.search().where('id').not.equalTo(session.user.id).returnAll()
		: [];
	const filepath = process.cwd() + '/prisma/db.sqlite';
	const oldDB = existsSync(filepath);
	return {
		users: jsonify(users) as DBUser[],
		user: jsonify(user!) as DBUser,
		has_sqlite: oldDB
	};
}

export const actions = {
	async default({ request, locals, fetch }) {
		const form = await request.formData();

		const _snapps_string = form.get('snapps')?.toString().trim();
		if (typeof _snapps_string !== 'string')
			return fail(400, {
				message: 'snapps:import:error'
			});

		const snapps = JSON.parse(_snapps_string) as DBSnapp[];

		await Promise.all(
			snapps.map(async (snapp) => {
				const id = randomUUID();

				await db.shorten({ ...snapp }, fetch);
			})
		);

		return {
			status: 200,
			message: 'snapps:import:successful'
		};
	}
};
