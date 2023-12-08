import { auth } from '$lib/server/lucia.js';
import { error, json, redirect } from '@sveltejs/kit';
import { LuciaError } from 'lucia';

export async function POST({ request }) {
	const form = await request.json();

	const username = form.username as string | undefined;
	const password = form.password as string | undefined;

	if (!password || !username)
		throw error(400, {
			message: 'The request payload is not valid. Please check your input data.'
		});

	try {
		const key = await auth.useKey('username', username.toLowerCase(), password);
		const session = await auth.createSession({
			userId: key.userId,
			attributes: {}
		});

		return json({ token: session.sessionId });
	} catch (e) {
		if (
			e instanceof LuciaError &&
			(e.message === 'AUTH_INVALID_KEY_ID' || e.message === 'AUTH_INVALID_PASSWORD')
		) {
			throw error(400, {
				message: 'Wrong credentials'
			});
		}
		throw error(500, {
			message: 'An unexpected server error occurred. Please try again later'
		});
	}

}

export function fallback() {
	throw error(405, { message: 'The requested method is not allowed.' });
}
