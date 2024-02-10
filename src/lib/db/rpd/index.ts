import type { Database } from '..';

export default async function checkRPDLimit(this: Database, userId: string, rpdLimit: number = 0) {
	// Key structure: rpd:{userId}:{date}
	const key = `limits:rpd:${userId}`;

	if (!rpdLimit) {
		return true;
	}

	// Check if the user has already made a request on the current date
	const count = await this.redis.get(key);

	if (count && parseInt(count) >= rpdLimit) {
		// User has exceeded the RPD limit
		return false;
	} else {
		// Increment the counter or set it to 1 if it doesn't exist
		await this.redis.incr(key);
		// Expire the counter at the end of the current day
		const midnight = new Date();
		midnight.setHours(24, 0, 0, 0);
		const secondsUntilMidnight = Math.ceil((midnight.getTime() - Date.now()) / 1000);
		await this.redis.expire(key, secondsUntilMidnight);
		return true;
	}
}
