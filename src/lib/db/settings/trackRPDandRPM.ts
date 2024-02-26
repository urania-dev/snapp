import parseNumber from '$lib/utils/parseNumber';
import type { Database } from '..';

export default async function trackRPDandRPM(this: Database, apiKey: DBAPIKey, _EN?: Translation) {
	if (apiKey.roles.includes('admin') || apiKey.roles.includes('superadmin')) return false;

	const is_limited = await this.getSetting('settings:app:limits:enabled').then(
		(res) => res === 'true' || false
	);
	if (!is_limited) return false;

	const global_limit_rpm = await parseNumber(this.getSetting('settings:app:limits:max:rpm'));
	const global_limit_rpd = await parseNumber(this.getSetting('settings:app:limits:max:rpd'));
	const user_limit = (
		(await this.users.search().where('id').equals(apiKey.user_id).first()) as DBUser
	)?.settings?.max;

	const rpd = user_limit?.rpd ?? global_limit_rpd;
	const rpm = user_limit?.rpm ?? global_limit_rpm;

	const under_the_max_request_limit =
		(await this.rpm(apiKey.user_id, rpm)) && (await this.rpd(apiKey.user_id, rpd));
	if (!under_the_max_request_limit) return true;
	return false
}
