import { authenticate_api } from '$lib/server/authenticate-api/index.js';
import { database } from '$lib/server/db/database.js';
import { prisma } from '$lib/server/prisma';
import { rateLimiterCheck } from '$lib/server/ratelimiter/index.js';
import {
	ALLOW_UNSECURE_HTTP,
	MAX_SNAPPS_PER_USER,
	SNAPP_ORIGIN_URL_BLACKLISTED,
	SNAPP_ORIGIN_URL_REQUESTED,
	UNAUTHORIZED
} from '$lib/utils/constants.js';
import { error, json } from '@sveltejs/kit';

export const GET = async (event) => {
	const token = await authenticate_api(event);
	if (!token) error(403);
	const limits = token.user.role === 'user' ? await rateLimiterCheck(token.key) : null;
	if (limits?.blocked) return json({ message: 'Too many requests' }, { status: 429 });

	const userId = event.url.searchParams.get('userId')?.toString() || undefined;
	const limit = parseInt(event.url.searchParams.get('limit')?.toString() || '10');
	const offset = parseInt(event.url.searchParams.get('offset')?.toString() || '0');
	const query = event.url.searchParams.get('query')?.toString();
	const orderBy = event.url.searchParams.get('order-by')?.toString() || undefined;
	const ascending = event.url.searchParams.get('ascending')?.toString() === 'true' || false;

	const [snapps, count] = await database.snapps.get(
		token.user.role === 'user' ? token.userId : userId,
		query,
		limit,
		offset,
		orderBy
			? {
					[orderBy]: ascending
				}
			: undefined
	);

	return json({ snapps, total: count, pagination: { limit, offset, query, orderBy, ascending } });
};

export const POST = async (event) => {
	const token = await authenticate_api(event);
	if (!token) error(403);
	const limits = token.user.role === 'user' ? await rateLimiterCheck(token.key) : null;
	if (limits?.blocked) return json({ message: 'Too many requests' }, { status: 429 });

	const {
		shortcode,
		original_url,
		secret,
		max_usages,
		notes,
		expiration,
		disabled,
		userId
	}: {
		shortcode: string;
		original_url: string;
		secret?: string | null;
		max_usages?: number;
		notes?: string;
		expiration?: Date | null;
		disabled?: boolean;
		userId?: string;
	} = await event.request.json();

	if (!original_url) return error(400, { message: 'Missing original url' });
	if (userId && token.user.role === 'user')
		return error(403, { message: "You're not allowed to create snapps for someone else" });

	const [snapp, err] = await database.snapps.create(
		{ shortcode, original_url, secret, max_usages, notes, expiration, disabled },
		userId && token.user.role === 'user' ? token.userId : userId || token.userId,
		event.fetch
	);

	let message: string | undefined = undefined;
	if (err === MAX_SNAPPS_PER_USER) message = 'This account reached its limit number of snapps.';
	if (err === SNAPP_ORIGIN_URL_REQUESTED) message = 'You must provide an Original URL';
	if (err === SNAPP_ORIGIN_URL_BLACKLISTED) message = 'Original URL is blacklisted';
	if (err === ALLOW_UNSECURE_HTTP) message = 'The original URL must be a secure https link';
	if (err === UNAUTHORIZED) message = 'Unauthorized';
	if (message) return error(400, { message });

	return json(snapp);
};

export const PATCH = async (event) => {
	const token = await authenticate_api(event);
	if (!token) error(403);
	const limits = token.user.role === 'user' ? await rateLimiterCheck(token.key) : null;
	if (limits?.blocked) return json({ message: 'Too many requests' }, { status: 429 });

	const {
		id,
		shortcode,
		original_url,
		secret,
		max_usages,
		notes,
		expiration,
		disabled
	}: {
		id: string;
		shortcode?: string;
		original_url?: string;
		secret?: string | null;
		max_usages?: number;
		notes?: string | null;
		expiration?: Date | null;
		disabled?: boolean;
	} = await event.request.json();

	if (!id) return error(400, { message: 'Missing Snapp ID' });
	const is_admin = token.user.role !== 'user';
	const editable = await prisma.snapp.findFirst({
		where: { id, userId: is_admin ? undefined : token.userId }
	});

	if (editable?.userId !== token.userId && is_admin === false)
		return error(403, { message: 'You cannot edit someone else URL.' });

	if (!editable) return error(404, { message: 'Snapp not found' });

	const [snapp, err] = await database.snapps.edit(
		{
			...editable,
			shortcode: shortcode || editable.shortcode,
			original_url: original_url || editable.original_url,
			secret: secret === null ? null : secret || editable.secret,
			max_usages: max_usages || editable.max_usages,
			expiration: expiration === null ? null : expiration || editable.expiration,
			notes: notes || editable.notes,
			disabled: disabled || editable.disabled
		},
		token.userId,
		event.fetch
	);

	let message: string | undefined = undefined;
	if (err === MAX_SNAPPS_PER_USER) message = 'This account reached its limit number of snapps.';
	if (err === SNAPP_ORIGIN_URL_REQUESTED) message = 'You must provide an Original URL';
	if (err === SNAPP_ORIGIN_URL_BLACKLISTED) message = 'Original URL is blacklisted';
	if (err === UNAUTHORIZED) message = 'Unauthorized';
	if (message) return error(400, { message });

	return json(snapp);
};

export const DELETE = async (event) => {
	const token = await authenticate_api(event);
	if (!token) error(403);
	const limits = token.user.role === 'user' ? await rateLimiterCheck(token.key) : null;
	if (limits?.blocked) return json({ message: 'Too many requests' }, { status: 429 });
	const { ids } = Object.fromEntries(event.url.searchParams); // ids is a string of "id, id, id"

	const [count, err] = await database.snapps.delete(token.userId, ...ids.split(','));
	if (!count || err) error(500, { message: 'System error' });

	return json({ count });
};

export const fallback = () => error(405);
