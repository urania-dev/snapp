import { authenticate_api } from '$lib/server/authenticate-api/index';
import { database } from '$lib/server/db/database';
import { rateLimiterCheck } from '$lib/server/ratelimiter';
import { error, json } from '@sveltejs/kit';

export const GET = async (event) => {
	const token = await authenticate_api(event);

	if (!token) error(403);

	const limits = token.user.role === 'user' ? await rateLimiterCheck(token.key) : null;

	if (limits?.blocked) return json({ message: 'Too many requests' }, { status: 429 });

	const { shortcode } = event.params;

	if (!shortcode) return error(404, { message: '/snapp/:shortcode - shortcode not found' });

	const [snapp, err] = await database.snapps.one(shortcode);

	const is_admin = await database.users.is_admin(token.userId);
	if (snapp?.userId !== token.userId && !is_admin) return error(404, 'Snapp not found');
	if (!snapp || err) return error(404, 'Snapp not found');
	return json(snapp);
};

export const fallback = () => error(405);
