import { whiteEmailZList, type Database, whiteProviderZList } from '..';

export default async function isWhiteListed(this: Database, email: string) {
	const isWhiteListed = await this.redis.zScore(whiteEmailZList, `${email}`);
	const isWhiteListedProvider = await this.redis.zScore(
		whiteProviderZList,
		`@${email.split('@')[1]}`
	);
	return {
		email: isWhiteListed !== null,
		provider: isWhiteListedProvider !== null
	};
}
