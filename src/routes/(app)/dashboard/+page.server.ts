import { prisma } from '$lib/server/prisma.js';
import type { Prisma } from '@prisma/client';
import { fail, redirect } from '@sveltejs/kit';

export async function load({ locals, request, url, depends }) {
	depends('u:list');
	const session = await locals.auth.validate();
	if (!session) throw redirect(302, '/');

	const settings = await prisma.settings.findMany({
		where: {
			user_id: {
				equals: session.user.userId
			},
			setting: {
				startsWith: 'dashboard-'
			}
		}
	});

	const take = (Number(url.searchParams.get('limit')) ||
		Number(settings.find((s) => s.setting === 'dashboard-max-entries')?.value) ||
		8) as number;
	const page = (Number(url.searchParams.get('page')) || 1) as number;
	const skip = (page && take && take * (page - 1)) || 0;
	const query = url.searchParams.get('query')?.toString();
	const sortBy = url.searchParams.get('sortBy')?.toString() as Columns | null;
	const dir = url.searchParams.get('dir')?.toString() as 'desc' | 'asc' | null;

	let orderBy:
		| Prisma.SnappOrderByWithRelationInput
		| Prisma.SnappOrderByWithRelationInput[]
		| undefined = undefined;

	if (sortBy) {
		switch (sortBy) {
			case 'created-at':
				orderBy = { created_at: dir ?? 'desc' };
				break;
			case 'expires-at':
				orderBy = { expires_at: dir ?? 'desc' };
				break;
			case 'original-url':
				orderBy = { original_url: dir ?? 'desc' };
				break;
			case 'short-code':
				orderBy = { short_code: dir ?? 'desc' };
				break;

			case 'usages':
				orderBy = { usages: { _count: dir ?? 'desc' } };
				break;

			default:
				orderBy = { created_at: dir ?? 'desc' };
				break;
		}
	}

	try {
		const snapps_count = await prisma.snapp.count({
			where: { user_id: { equals: session.user.userId } }
		});
		const snapps = await prisma.snapp.findMany({
			where: {
				user_id: {
					equals: session.user.userId
				},

				OR: query
					? [{ short_code: { startsWith: query } }, { original_url: { contains: query } }]
					: undefined
			},
			take,
			skip,
			include: {
				_count: {
					select: { usages: true }
				}
			},
			orderBy
		});

		return {
			snapps,
			sortBy,
			sortDir: dir,
			max_entries: take,
			page,
			url: url.toString(),
			end_reached: snapps_count <= take * page,
			total: snapps_count,
			query,
			dashboard_columns: settings.find((s) => s.setting === 'dashboard-columns')?.value?.split(',')
		};
	} catch (error) {
		throw error;
	}
}

export const actions = {
	'delete-snapps': async function ({ request, locals }) {
		const session = await locals.auth.validate();
		if (!session) throw redirect(302, '/');
		const form = await request.formData();
		const ids = form.get('ids') as string | null;

		let ids_to_delete = ids?.split(',') ?? [];

		await prisma.snapp.deleteMany({
			where: {
				user_id: session.user.userId,
				id: {
					in: ids_to_delete
				}
			}
		});
	},
	'save-max-entries-preference': async function ({ locals, request }) {
		const session = await locals.auth.validate();
		if (!session) throw redirect(302, '/');
		const form = await request.formData();
		let maxEntries = form.get('max-entries') as number | null;

		if (maxEntries === null) return fail(500, { message: 'An unexpected server error occurred. Please try again later' });

		const upsert = await prisma.settings.upsert({
			create: {
				id: session.user.userId + ':dashboard-max-entries',
				user_id: session.user.userId,
				setting: 'dashboard-max-entries',
				value: String(maxEntries)
			},
			update: {
				value: String(maxEntries)
			},
			where: {
				id: session.user.userId + ':dashboard-max-entries'
			}
		});
		return {};
	},
	'save-columns-preference': async function ({ locals, request }) {
		const session = await locals.auth.validate();
		if (!session) throw redirect(302, '/');
		const form = await request.formData();
		let actual_columns = form.get('columns') as string | null;
		if (actual_columns === null) return fail(500, { message: 'An unexpected server error occurred. Please try again later' });

		const upsert = await prisma.settings.upsert({
			create: {
				id: session.user.userId + ':dashboard-columns',
				user_id: session.user.userId,
				setting: 'dashboard-columns',
				value: actual_columns
					.split(',')
					.filter((value) => !!value)
					.join(',')
			},
			update: {
				value: actual_columns
					.split(',')
					.filter((value) => !!value)
					.join(',')
			},
			where: {
				id: session.user.userId + ':dashboard-columns'
			}
		});
		return {};
	}
};
