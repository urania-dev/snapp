import { prisma } from '$lib/server/prisma.js';
import { generateRandomString } from '$lib/utils/generateRandomString.js';
import { slugify } from '$lib/utils/slugify.js';
import type { Prisma, Snapp } from '@prisma/client';
import { error, json } from '@sveltejs/kit';
import bcrypt from 'bcrypt';

export async function GET({ locals, params: { id }, url }) {
	const session = await locals.auth.validateBearerToken();
	if (!session) throw error(401, { message: 'Unauthorized access. Please authenticate first.' });

	if (typeof id !== 'string' || id.trim() === '') {
		throw error(400, {
			message: 'ID or ShortCode not set'
		});
	}

	const short_code = id;
	const usages = url.searchParams.get('usages');

	const take = (Number(url.searchParams.get('limit')) || 5) as number;
	const page = (Number(url.searchParams.get('page')) || 1) as number;
	const skip = (page && take && take * (page - 1)) || 0;
	const sortBy = url.searchParams.get('sortBy')?.toString() as string | null;
	const dir = url.searchParams.get('dir')?.toString() as 'desc' | 'asc' | null;

	let orderBy:
		| Prisma.UrlUsageOrderByWithRelationInput
		| Prisma.UrlUsageOrderByWithRelationInput[]
		| undefined = undefined;

	if (sortBy) {
		switch (sortBy) {
			case 'timestamp':
				orderBy = { timestamp: dir ?? 'desc' };
				break;
			case 'snapp_id':
				orderBy = { snapp_id: dir ?? 'desc' };
				break;
			case 'country':
				orderBy = { country: dir ?? 'desc' };
				break;
			case 'city':
				orderBy = { city: dir ?? 'desc' };
				break;
			case 'region':
				orderBy = { region: dir ?? 'desc' };
				break;
			case 'user_agent':
				orderBy = { user_agent: dir ?? 'desc' };
				break;
			case 'referrer':
				orderBy = { referrer: dir ?? 'desc' };
				break;
			case 'language':
				orderBy = { language: dir ?? 'desc' };
				break;
			case 'browser':
				orderBy = { browser: dir ?? 'desc' };
				break;
			case 'os':
				orderBy = { os: dir ?? 'desc' };
				break;
			case 'device':
				orderBy = { device: dir ?? 'desc' };
				break;
			case 'cpu':
				orderBy = { cpu: dir ?? 'desc' };
				break;
			case 'id':
				orderBy = { id: dir ?? 'desc' };
				break;
		}
	}
	try {
		const snapp = await prisma.snapp.findFirst({
			where: {
				OR: [{ id }, { short_code }]
			},
			include: {
				_count: usages ? { select: { usages: usages ? true : false } } : undefined,
				usages: usages
					? {
							orderBy,
							take,
							skip
					  }
					: false
			}
		});

		if (snapp === null)
			throw error(404, { message: 'The requested resource was not found. Please verify the resource URL.' });
		return json(snapp);
	} catch (error) {
		throw error;
	}
}

export async function POST({ request, locals, params: { id }, url }) {
	const session = await locals.auth.validateBearerToken();
	if (!session) throw error(401, { message: 'Unauthorized access. Please authenticate first.' });

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
			message: 'Original url must be set'
		});

	if (typeof data.short_code !== 'string' || data.short_code.trim() === '') {
		data.short_code = generateRandomString(
			(data.short_code && Number(data.short_code.length)) || 5
		);
	} else data.short_code = await check_short_code(slugify(data.short_code));

	let hashed = data.secret ? await bcrypt.hash(data.secret, 12) : undefined;
	try {
		let new_url = await prisma.snapp
			.update({
				data: {
					...(data as Snapp),
					has_secret: data.secret !== null && data.secret?.trim() !== '',
					secret: hashed,
					expires_at:
						data.expires_at !== null && data.expires_at !== undefined
							? new Date(data.expires_at)
							: null,
					user_id: session.user.userId
				},
				where: { id }
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
	const id = form.get('id')?.toString();

	if (!id) throw error(400, { message: 'The request payload is not valid. Please check your input data.' });

	try {
		const deleted = await prisma.snapp.deleteMany({
			where: {
				user_id: {
					equals: session.user.userId
				},
				id
			}
		});
		return json({ deleted: deleted.count });
	} catch (error) {
		throw error;
	}
}

export function fallback() {
	throw error(405, { message: 'The requested method is not allowed.' });
}
