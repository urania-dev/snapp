import { error, json } from '@sveltejs/kit';
import { getSettings } from '$lib/server/config/index.js';
import { log } from '$lib/server/log';
import { watchLists } from '$lib/server/watchlists/index.js';

export const GET = async ({ fetch, locals: { user } }) => {
	if (!user) return error(401, { message: 'forbidden' });
	const isAdmin = user.role;
	const settings = getSettings();
	const VTAPI_KEY = (await settings).get<string>('VTAPI_KEY');
	if (!VTAPI_KEY) return json({ status: false });
	try {
		const status = (isAdmin && (await watchLists.checkVTApiKeyStatus(fetch, VTAPI_KEY))) || false;
		if (process.env.LOG_LEVEL === 'debug') log.info({ status, VTAPI_KEY });
		return json({ status });
	} catch (error) {
		log.error(error);
	}

	return json({ status: false });
};
