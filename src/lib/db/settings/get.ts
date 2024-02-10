import type { Database } from '..';

const settingsHash = 'settings:global';
export default async function getSettings(this: Database, id: string, hash = settingsHash) {
	try {
		return await this.redis.hGet(hash, id);
	} catch (error) {
		console.log(error);
	}
}
