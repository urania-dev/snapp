
class SlidingWindowCounter {
	private windowSize: number; // in milliseconds
	private bucketCount: number;
	private requestCounts: Map<string, number[]>;
	private lastResetTimes: Map<string, number>;
	private active: boolean;

	constructor() {
		this.windowSize = 0;
		this.bucketCount = 0;
		this.requestCounts = new Map();
		this.lastResetTimes = new Map();
		this.active = false;
	}

	configure = (windowSize: number, bucketCount: number) => {
		this.windowSize = windowSize;
		this.bucketCount = bucketCount;
	};

	enable = () => {
		this.active = true;
	};
	disable = () => {
		this.active = false;
	};

	private getCurrentBucket = (apiKey: string): number => {
		const now = Date.now();
		const lastResetTime = this.lastResetTimes.get(apiKey) || now;
		const timeSinceLastReset = now - lastResetTime;
		const currentBucket = Math.floor(timeSinceLastReset / (this.windowSize / this.bucketCount));
		return currentBucket % this.bucketCount;
	};

	private resetBuckets = (apiKey: string): void => {
		const now = Date.now();
		const lastResetTime = this.lastResetTimes.get(apiKey) || now;
		const timeSinceLastReset = now - lastResetTime;
		const bucketsToReset = Math.floor(timeSinceLastReset / (this.windowSize / this.bucketCount));

		if (!this.requestCounts.has(apiKey)) {
			this.requestCounts.set(apiKey, Array(this.bucketCount).fill(0));
		}

		const counts = this.requestCounts.get(apiKey);
		for (let i = 0; i < bucketsToReset && i < this.bucketCount; i++) {
			counts![(this.getCurrentBucket(apiKey) + i) % this.bucketCount] = 0;
		}

		this.lastResetTimes.set(
			apiKey,
			lastResetTime + bucketsToReset * (this.windowSize / this.bucketCount)
		);
	};

	check = (apiKey: string): boolean => {
		if (!this.active) return false;
		this.resetBuckets(apiKey);
		const currentBucket = this.getCurrentBucket(apiKey);
		const counts = this.requestCounts.get(apiKey) || [];
		const totalRequests = counts.reduce((a, b) => a + b, 0);

		if (totalRequests >= this.bucketCount) {
			return true; // Too Many Requests
		}

		counts[currentBucket]++;
		this.requestCounts.set(apiKey, counts);
		return false; // OK
	};

	getRemainingTimeBlocked = (apiKey: string): number => {
		const now = Date.now();
		const lastResetTime = this.lastResetTimes.get(apiKey) || now;
		const timeSinceLastReset = now - lastResetTime;

		if (timeSinceLastReset < this.windowSize) {
			return this.windowSize - timeSinceLastReset;
		} else {
			return 0; // Not blocked
		}
	};
}

function getRateLimiterInstance(
	instanceKey: '_rpd_limiter' | '_rpm_limiter' | "_mfa_limiter"
): SlidingWindowCounter {
	if (!globalThis[instanceKey]) globalThis[instanceKey] = new SlidingWindowCounter();

	return globalThis[instanceKey];
}

const RPD = getRateLimiterInstance('_rpd_limiter');
const RPM = getRateLimiterInstance('_rpm_limiter');

const rateLimiterCheck = async (token: string) => {
	const rpdBlocked = RPD.check(token);
	const rpmBlocked = RPM.check(token);

	if (rpdBlocked || rpmBlocked) {
		const rpdRemainingTime = RPD.getRemainingTimeBlocked(token);
		const rpmRemainingTime = RPM.getRemainingTimeBlocked(token);
		const remainingTime = Math.floor(
			Math.max(rpdBlocked ? rpdRemainingTime : 0, rpmBlocked ? rpmRemainingTime : 0) / 1000
		);
		return { blocked: true, remainingTime };
	}

	return { blocked: false, remainingTime: 0 };
};



export { RPD, RPM, rateLimiterCheck };
