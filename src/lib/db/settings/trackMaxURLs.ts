import parseNumber from '$lib/utils/parseNumber';
import type { Database } from '..';

export default async function trackMaxURLs(this: Database, apiKey: DBAPIKey, _EN?: Translation) {
	if (apiKey.roles.includes('admin') || apiKey.roles.includes('superadmin')) return false;

	const is_limited = await this.getSetting('settings:app:limits:enabled').then(
		(res) => res === 'true' || false
	);
	if (!is_limited) return false;

	const global_limit_urls = await parseNumber(this.getSetting('settings:app:limits:max:urls'));

	const user_limit = (
		(await this.users.search().where('id').equals(apiKey.user_id).first()) as DBUser
	)?.settings?.max;

	const urls_by_this_user = await this.snapps
		.search()
		.where('user_id')
		.equal(apiKey.user_id)
		.returnCount();

	const limit = user_limit?.urls ?? global_limit_urls;

	if (!limit || urls_by_this_user <= limit) {
		return false;
	} else true;
}
