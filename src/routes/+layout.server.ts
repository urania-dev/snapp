import { env } from '$env/dynamic/private';
import { db } from '$lib/db/index.js';
import jsonify from '$lib/utils/jsonify/index.js';

export async function load({ locals, depends, fetch, cookies }) {
	depends('snapp:main');
	const session = await locals.getSession();

	const user =
		session && (await db.users.search().where('id').equal(session?.user.id).returnFirst());

	const theme = locals.theme;
	const lang = locals.lang;
	const { localization, locales, languages } = (await (
		await fetch('/api/localization?lang=' + lang, {
			method: 'GET'
		})
	).json()) as {
		localization: Record<string, string>;
		locales: string[];
		languages: { label: string; code: string }[];
	};
	const max_urls = await db.getSetting('settings:app:limits:max:urls');
	const version = env.SNAPP_VERSION;
	const isAdmin = session ? (await db.admin(session.user.id)) === true : false;
	return {
		session,
		theme,
		lang,
		localization,
		locales,
		languages,
		appversion: version,
		max_urls,
		isAdmin,
		user: user !== null ? jsonify(user) : null
	};
}
