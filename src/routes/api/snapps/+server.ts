import { auth } from '$lib/server/lucia.js';
import { prisma } from '$lib/server/prisma.js';
import { generateRandomString } from '$lib/utils/generateRandomString.js';
import { slugify } from '$lib/utils/slugify.js';
import type { Prisma, Snapp } from '@prisma/client';
import { error, json } from '@sveltejs/kit';
import bcrypt from 'bcrypt';

export async function GET({ locals, request, url }) {
	const session = await locals.auth.validateBearerToken();
	if (session === null)
		throw error(401, { message: 'Unauthorized access. Please authenticate first.' });

	const take = (Number(url.searchParams.get('limit')) || 10) as number;
	const page = (Number(url.searchParams.get('page')) || 1) as number;
	const skip = (page && take && take * (page - 1)) || 0;
	const query = url.searchParams.get('query')?.toString();
	const sortBy = url.searchParams.get('sortBy')?.toString() as string | null;
	const dir = url.searchParams.get('dir')?.toString() as 'desc' | 'asc' | null;
	const count = url.searchParams.get('count')?.toString() === 'true';

	let orderBy:
		| Prisma.SnappOrderByWithRelationInput
		| Prisma.SnappOrderByWithRelationInput[]
		| undefined = undefined;

	if (sortBy) {
		switch (sortBy) {
			case 'created_at':
				orderBy = { created_at: dir ?? 'desc' };
				break;
			case 'expires_at':
				orderBy = { expires_at: dir ?? 'desc' };
				break;
			case 'original_url':
				orderBy = { original_url: dir ?? 'desc' };
				break;
			case 'short_code':
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
			include: count
				? {
						_count: {
							select: { usages: true }
						}
				  }
				: undefined,
			orderBy
		});
		const response = count
			? { snapps, count: await prisma.snapp.count({ where: { user_id: session.user.userId } }) }
			: snapps;
		return json(response);
	} catch (error) {
		throw error;
	}
}

export async function POST({ locals, request, cookies }) {
	const session = await locals.auth.validateBearerToken();

	if (session === null)
		throw error(401, { message: 'Unauthorized access. Please authenticate first.' });

	let data = (await request.json()) as Partial<Snapp>;
	async function check_short_code(slug: string) {
		const exists = await prisma.snapp.findMany({
			where: { short_code: { startsWith: slug } },
			select: { _count: true }
		});

		if (exists.length > 0) return `${slug}-${exists.length}`;
		else return slug;
	}
	if (typeof data.original_url !== 'string' || data.original_url?.trim() === '')
		throw error(400, {
			message:
				'The request payload is not valid. Please check your input data. Original url must be set'
		});
	const regex = new RegExp(/^https:\/\/[^\s/$.?#].[^\s]*$/);
	const valid_original_url = regex.test(data.original_url);
	if (valid_original_url === false)
		throw error(400, {
			message:
				'The request payload is not valid. Please check your input data. Original url must be set'
		});

	if (typeof data.short_code !== 'string' || data.short_code.trim() === '') {
		data.short_code = generateRandomString(
			(data.short_code && Number(data.short_code.length)) || 5
		);
	} else data.short_code = await check_short_code(slugify(data.short_code));

	let hashed = data.secret ? await bcrypt.hash(data.secret, 12) : undefined;
	try {
		let new_url = await prisma.snapp
			.create({
				data: {
					...(data as Snapp),
					has_secret: data.secret !== null && data.secret?.trim() !== '',
					secret: hashed,
					expires_at:
						data.expires_at !== null && data.expires_at !== undefined
							? new Date(data.expires_at)
							: null,
					user_id: session.user.userId
				}
			})
			.then((res) => {
				let data = res as Partial<typeof res>;
				if (data.secret) delete data.secret;
				return data;
			});

		return json(new_url);
	} catch (error) {
		throw error;
	}
}

export async function DELETE({ locals, request }) {
	const session = await locals.auth.validateBearerToken();

	if (!session) throw error(401, { message: 'Unauthorized access. Please authenticate first.' });
	const form = await request.json();

	if (!form.ids)
		throw error(400, {
			message: 'The request payload is not valid. Please check your input data.'
		});

	let { ids } = form as { ids: string[] };

	try {
		const snapps = await prisma.snapp.deleteMany({
			where: {
				user_id: {
					equals: session.user.userId
				},
				id: { in: ids }
			}
		});
		return json({ deleted: snapps.count });
	} catch (error) {
		throw error;
	}
}

export function fallback() {
	throw error(405, { message: 'The requested method is not allowed.' });
}
