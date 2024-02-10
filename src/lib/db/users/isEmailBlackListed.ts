import { type Database, emailZList, providerZList } from '..';

export default async function isBanned(this: Database, email: string) {
	const isBannedProvider = await this.redis.zScore(providerZList, `@${email.split('@')[1]}`);
	const isBanned = await this.redis.zScore(emailZList, email);

	return {
		email: isBanned !== null,
		provider: isBannedProvider !== null
	};
}
