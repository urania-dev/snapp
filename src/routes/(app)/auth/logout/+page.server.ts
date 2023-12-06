import { auth } from '$lib/server/lucia.js';
import { redirect } from '@sveltejs/kit';

export async function load({ locals, cookies }) {
	const session = await locals.auth.validate();

	if (!session) throw redirect(302, '/');

	await auth.invalidateSession(session.sessionId);

	// for session cookies
	// create blank session cookie
	const sessionCookie = auth.createSessionCookie(null);

	cookies.set('auth_session', sessionCookie.serialize());

	throw redirect(302, '/');
}
