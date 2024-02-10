import { type Database, usernameZList, domainZList } from '..';

export default async function isBanned(
	this: Database,
	payload: { username?: string; domain?: string }
) {
	let value: string;
	let key: string;
	if (payload.domain) {
		key = domainZList;
		value = payload.domain.trim();
		const has_subdomain = value.split('.').length > 1;
		if (has_subdomain) {
			let main = await this.redis.zScore(key, value.split('.').slice(1).join('.'));
			if (main) return true;
		}
	} else if (payload.username) {
		key = usernameZList;
		value = payload.username.trim();
	}

	const isBanned = await this.redis.zScore(key!, value!);
	if (isBanned) return true;
	else return false;
}
