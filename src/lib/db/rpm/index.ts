import type { Database } from '..';

export default async function checkRPMLimit(this: Database, userId: string, rpmLimit: number = 0) {
	const key = `limits:rpm:${userId}`;

	if (!rpmLimit) {
		return true;
	}

	// Check if the user has already made a request in the current minute
	const count = await this.redis.get(key);

	if (count && parseInt(count) >= rpmLimit) {
		// User has exceeded the RPM limit
		return false;
	} else {
		// Increment the counter or set it to 1 if it doesn't exist
		await this.redis.incr(key);

		// Expire the counter at the end of the current minute
		await this.redis.expire(key, 60);

		return true;
	}
}
