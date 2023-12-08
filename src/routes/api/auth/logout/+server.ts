import { auth } from '$lib/server/lucia.js';
import { json, redirect } from '@sveltejs/kit';

export async function fallback({ locals, cookies }) {
	const session = await locals.auth.validateBearerToken();

	if (!session) return json({ authenticated: false });

	await auth.invalidateSession(session.sessionId);

	// for session cookies
	// create blank session cookie
	const sessionCookie = auth.createSessionCookie(null);

	cookies.set('auth_session', sessionCookie.serialize());

	return json({
		authenticated: false
	});
}
