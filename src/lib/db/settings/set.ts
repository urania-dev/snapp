import { Database } from '..';
const settingsHash = 'settings:global';

export default async function setSetting(
	this: Database,
	id: string,
	value: string,
	hash: string = settingsHash
) {
	try {
		await this.redis.hSet(hash, id, value);
		return value;
	} catch (error) {
		console.log(error);
	}
}
