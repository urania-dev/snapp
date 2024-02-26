import authenticate from '$lib/api/utils/authenticate.js';
import getLanguage from '$lib/api/utils/getLanguage.js';
import getUrlParams from '$lib/api/utils/getUrlParams.js';
import { db } from '$lib/db/index.js';
import SnappError from '$lib/db/utils/snappError.js';
import { error, json, type NumericRange } from '@sveltejs/kit';
import type { RedisOmError } from 'redis-om';
import bcrypt from 'bcrypt';
import { extractDomain } from '$lib/db/snapps/shorten.js';
import { randomUUID } from 'crypto';

export async function GET({ request, url }) {
	const EN = await getLanguage();
	const apiKey = await authenticate(request, EN);

	const isLimited = await db.trackRPDandRPM(apiKey, EN);
	if (isLimited) throw error(429, { message: EN['api:error:too:many:request'] });

	const { page, limit, search, sort, sortDir, offset } = getUrlParams(url);
	let query = db.snapps.search();

	if (sort && sortDir === 'asc') query.sortAsc(sort);
	if (sort && sortDir === 'desc') query.sortDesc(sort);

	if (search && search !== '')
		query.where('shortcode').does.equals(`*${search}*`).or('original_url').equal(`*${search}*`);

	try {
		const count = await query.returnCount();
		const urls = await query.return.page(offset, limit).then((urls) =>
			urls.map((url) => {
				delete url.secret;
				return url;
			})
		);

		return json(
			{ count, page, limit, sort, sortDirection: sortDir, data: urls },
			{
				headers: {
					'Content-Type': 'application/json',
					'cache-control': 'max-age=' + 60 * 60,
					'Access-Control-Allowed-Origins': '*'
				}
			}
		);
	} catch (err) {
		throw error(500, { message: (err as RedisOmError)?.message });
	}
}

export async function POST({ request, fetch }) {
	const EN = await getLanguage();
	const apiKey = await authenticate(request, EN);

	const isLimited = await db.trackRPDandRPM(apiKey, EN);
	if (isLimited) throw error(429, { message: EN['api:error:too:many:request'] });
	const hasReachedMaxLimit = await db.trackMaxURLs(apiKey, EN);
	if (hasReachedMaxLimit) throw error(401, { message: EN['api:error:too:many:shorturl'] });

	const form = await request.formData();
	const { user_id } = apiKey;
	if (
		user_id !== undefined &&
		!(apiKey.roles.includes('admin') || apiKey.roles.includes('superadmin'))
	) {
		throw error(401, { message: EN['auth:not:authorized'] });
	}

	let original_url = form.get('original_url')?.toString().trim();
	let shortcode = form.get('shortcode')?.toString().trim();

	let secret = form.get('secret')?.toString().trim();

	let max_usages = form.get('max_usages')?.toString().trim();
	const _expires = form.get('ttl')?.toString().trim();

	let notes = form.get('notes')?.toString().trim().replaceAll('  ', ' ');
	let usages: number | undefined;
	if (max_usages && typeof max_usages === 'string' && isNaN(Number(max_usages)) === false)
		usages = Number(max_usages);

	let expiration: number | undefined;

	if (_expires) expiration = _expires === '-1' ? -1 : Math.ceil(Number(_expires) / 1000);

	let newSnapp: Partial<DBSnapp> = {
		id: randomUUID(),
		original_url,
		shortcode,
		secret,
		max_usages: usages,
		notes,
		user_id
	};

	const create = await db.shorten(newSnapp, fetch, expiration);

	if (create.status !== 200) {
		const {
			status,
			data: { message }
		} = create as SnappError;
		throw error(status as NumericRange<400, 599>, { message: EN[message] });
	} else return json(create);
}

export async function PATCH({ request, fetch }) {
	const EN = await getLanguage();
	const apiKey = await authenticate(request, EN);

	const isLimited = await db.trackRPDandRPM(apiKey, EN);
	if (isLimited) throw error(429, { message: EN['api:error:too:many:request'] });

	const form = await request.formData();
	const id = form.get('id')?.toString();

	if (!id) throw error(400, { message: EN['snapps:id:unset'] });
	let editSnapp = await db.snapps.fetch(id).then(async (res) => {
		if (!res.created) throw error(404, { message: 'snapps:not:found' });

		res.ttl = Number(await db.redis.ttl('snapps:' + id));

		res.status = 'active';

		if (res.max_usages && res.used && Number(res.max_usages) <= Number(res.used))
			res.status = 'disabled';
		if (await db.blacklisted({ domain: extractDomain(res.original_url as string)! }))
			res.status = 'blacklisted';

		return res as DBSnapp as DBSnappEnriched;
	});

	let original_url = form.get('original_url')?.toString().trim();
	let shortcode = form.get('shortcode')?.toString().trim();

	if (original_url) editSnapp.original_url = original_url;
	if (shortcode) editSnapp.shortcode = shortcode;

	let secret = form.get('secret')?.toString().trim();

	let max_usages = form.get('max_usages')?.toString().trim();
	const _expires = form.get('ttl')?.toString().trim();

	let notes = form.get('notes')?.toString().trim().replaceAll('  ', ' ');
	let usages: number | undefined;
	if (max_usages && typeof max_usages === 'string' && isNaN(Number(max_usages)) === false)
		usages = Number(max_usages);

	let expiration: number | undefined = await db.redis.ttl('snapps:' + editSnapp.id);

	if (_expires) expiration = _expires === '-1' ? undefined : Math.ceil(Number(_expires) / 1000);
	if (secret)
		editSnapp.secret = await bcrypt
			.genSalt(10)
			.then((salt) => bcrypt.hash(secret as string, salt))
			.then((hash) => hash);
	if (notes) editSnapp.notes = notes;
	if (usages) editSnapp.max_usages = usages;

	const result = await db.edit(editSnapp, fetch, expiration);

	if (result.status !== 200) {
		const EN = await getLanguage();
		const {
			status,
			data: { message }
		} = result as SnappError;
		throw error(status as NumericRange<400, 599>, { message: EN[message] });
	} else return json(result);
}

export async function DELETE({ request, url }) {
	const EN = await getLanguage();
	const apiKey = await authenticate(request, EN);

	const isLimited = await db.trackRPDandRPM(apiKey, EN);
	if (isLimited) throw error(429, { message: EN['api:error:too:many:request'] });

	const { user_id } = apiKey;

	let _ids = url.searchParams.get('ids')?.toString();
	let ids = _ids?.split(',') ?? [];

	const is_admin = await db.admin(user_id);
	if (!is_admin)
		await Promise.all(
			ids.map(async (id) => {
				const author = await db.authorship({ id, user_id });

				if (author.status === 200 && author.is_author === true) {
					// pass
				} else {
					throw error(401, { message: EN['auth:not:authorized'] });
				}
			})
		);

	await db.snapps.remove(...ids);

	return json({ deleted_ids: ids });
}
