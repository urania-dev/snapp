import type { Database } from '..';

export default async function checkRepoInfo(
	this: Database,
	fetch: (input: string | URL | Request, init?: RequestInit | undefined) => Promise<Response>
) {
	const key = `settings:repo:info`;

	const stored = await this.redis.get(key);

	if (stored) {
		return JSON.parse(stored);
	} else {
		const repoInfo = await (await fetch('https://api.github.com/repos/urania-dev/snapp')).json();
		await this.redis.set(key, JSON.stringify(repoInfo));
		await this.redis.expire(key, 60 * 60 * 24);
		
		return repoInfo;
	}
}
