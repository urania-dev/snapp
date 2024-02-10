import { db } from '$lib/db';
import { error } from '@sveltejs/kit';
import getLanguage from './getLanguage';

export default async function authenticate(request: Request, locale?: Translation) {
	const EN = locale ? locale : await getLanguage();
	const token = request.headers.get('authorization')?.split('Bearer ')[1];
	if (!token) throw error(401, { message: EN['auth:not:authorized'] });
	const apiKey = (await db.apikeys.search().where('id').equals(token).first()) as DBAPIKey;
	if (!apiKey) throw error(401, { message: EN['auth:not:authorized'] });
	if (
		!apiKey.roles ||
		(!apiKey.roles.includes('admin') &&
			!apiKey.roles.includes('user') &&
			!apiKey.roles.includes('superadmin'))
	)
		throw error(401, { message: EN['auth:not:authorized'] });
	return apiKey;
}
