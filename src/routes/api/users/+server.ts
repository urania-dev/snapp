import { authenticate_api } from '$lib/server/authenticate-api/index.js';
import { database } from '$lib/server/db/database.js';
import { rateLimiterCheck } from '$lib/server/ratelimiter';
import {
	EMAIL_EXISTS,
	ENABLED_SIGNUP,
	USER_DOES_NOT_EXISTS,
	USER_EXISTS
} from '$lib/utils/constants.js';
import { error, json } from '@sveltejs/kit';

export const GET = async (event) => {
	const token = await authenticate_api(event);
	if (!token) error(403);
	if (token.user.role === 'user') return error(403, 'Forbidden');
	const is_admin = token.user.role !== 'user' && (await database.users.is_admin(token.userId));
	if (!is_admin) return error(403, 'Forbidden');

	const limit = parseInt(event.url.searchParams.get('limit')?.toString() || '10');
	const offset = parseInt(event.url.searchParams.get('offset')?.toString() || '0');
	const query = event.url.searchParams.get('query')?.toString();

	const [users, count] = await database.users.get(query, limit, offset);

	return json({ users, total: count, pagination: { query, limit, offset } });
};

export const POST = async (event) => {
	const token = await authenticate_api(event);
	if (!token) error(403);
	const limits = token.user.role === 'user' ? await rateLimiterCheck(token.key) : null;
	if (limits?.blocked) return json({ message: 'Too many requests' }, { status: 429 });
	const is_admin = token.user.role !== 'user' && (await database.users.is_admin(token.userId));
	if (!is_admin) return error(403, 'Forbidden');
	const {
		username,
		email,
		password,
		confirm_password
	}: {
		username: string;
		email: string;
		password: string;
		confirm_password: string;
	} = await event.request.json();

	if (
		!email ||
		typeof email !== 'string' ||
		!/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/.test(email) ||
		!email.trim().length
	)
		return error(400, { message: 'Invalid email provided' });
	if (!username || typeof username !== 'string' || !username.trim().length)
		error(400, { message: 'Invalid username provided' });
	if (
		!password ||
		typeof password !== 'string' ||
		!password.trim().length ||
		!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/.test(password)
	)
		return error(400, { message: 'Invalid password provided' });
	if (
		!confirm_password ||
		typeof confirm_password !== 'string' ||
		!confirm_password.trim().length ||
		confirm_password !== password
	)
		return error(400, { message: "Password and confirmation password don't match" });

	const enabled_signup = database.settings.parse(await database.settings.get(ENABLED_SIGNUP), true);
	if (!enabled_signup) return error(401, { message: 'Signup are disabled by administrator' });

	const [email_user, email_provider] = email.split('@');
	const is_email_allowed = await database.watchlist.check(email_provider, email_user);
	const is_username_allowed = await database.watchlist.check(null, username);
	if (!is_email_allowed || !is_username_allowed)
		return error(400, { message: 'This username or email is blacklisted' });

	const [user, err] = await database.users.create(username, email, password);
	let message = null;
	if (err && err === USER_EXISTS) message = 'Username already taken';
	if (err && err === EMAIL_EXISTS) message = 'Email already associated to an account';
	if (message) return error(500, { message });

	return json(user);
};
export const PATCH = async (event) => {
	const token = await authenticate_api(event);
	if (!token) error(403);
	const is_admin = token.user.role !== 'user' && (await database.users.is_admin(token.userId));
	const limits = !is_admin ? await rateLimiterCheck(token.key) : null;
	if (limits?.blocked) return json({ message: 'Too many requests' }, { status: 429 });

	const {
		id,
		username,
		email,
		password,
		confirm_password,
		role
	}: {
		id: string;
		username?: string;
		email?: string;
		password?: string;
		confirm_password?: string;
		role?: 'user' | 'admin';
	} = await event.request.json();
	if (id !== token.userId && !is_admin)
		return error(401, { message: "You' re not allowed to edit other users" });
	if (
		email &&
		(typeof email !== 'string' ||
			!/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/.test(email) ||
			!email.trim().length)
	)
		return error(400, { message: 'Invalid email provided' });
	if (username && (typeof username !== 'string' || !username.trim().length))
		error(400, { message: 'Invalid username provided' });
	if (
		password &&
		(typeof password !== 'string' ||
			!password.trim().length ||
			!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/.test(password))
	)
		return error(400, { message: 'Invalid password provided' });
	if (
		password &&
		confirm_password &&
		(typeof confirm_password !== 'string' ||
			!confirm_password.trim().length ||
			confirm_password !== password)
	)
		return error(400, { message: "Password and confirmation password don't match" });

	const [email_user, email_provider] = (email && email.split('@')) || [null, null];
	const is_email_allowed = email && (await database.watchlist.check(email_provider, email_user));
	const is_username_allowed = username && (await database.watchlist.check(null, username));
	if ((email && !is_email_allowed) || (username && !is_username_allowed))
		return error(400, { message: 'This username or email is blacklisted' });
	if (!is_admin && role && role !== 'user') return error(403, { message: 'Forbidden role change' });
	const update = { id, username, email, password, confirm_password, role };
	if (id !== token.userId && !is_admin) return error(403, 'Forbidden');
	const [user, err] = await database.users.update(update, id);

	let message = null;
	if (err && err === USER_EXISTS) message = 'Username already taken';
	if (err && err === EMAIL_EXISTS) message = 'Email already associated to an account';
	if (err && err === USER_DOES_NOT_EXISTS) message = "User doesn't exists";
	if (message) return error(500, { message });

	return json(user);
};

export const DELETE = async (event) => {
	const token = await authenticate_api(event);
	if (!token) error(403);
	const is_admin = token.user.role !== 'user' && (await database.users.is_admin(token.userId));
	const limits = is_admin ? await rateLimiterCheck(token.key) : null;
	if (limits?.blocked) return json({ message: 'Too many requests' }, { status: 429 });

	const {
		id,
		username,
		email,
		ignore_admin = false
	}: {
		id?: string;
		username?: string;
		email?: string;
		ignore_admin?: boolean;
	} = Object.fromEntries(event.url.searchParams);

	if (id !== token.userId) return error(403, { message: "You can't delete other users" });
	if (ignore_admin && !is_admin) return error(403, { message: "You can't erase an admin user" });

	return json({
		deleted: await database.users.delete(id, username, email, ignore_admin ? ['root'] : undefined)
	});
};

export const fallback = () => error(405);
