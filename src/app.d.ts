declare global {
	type Language = 'it' | 'en' | 'es' | 'ga';
	type MenuItem = {
		label: string;
		url: string;
		visible: boolean;
		active: boolean;
		icon: string;
		css?: string;
	};

	type SvelteFetch = {
		(input: RequestInfo | URL, init?: RequestInit): Promise<Response>;
		(input: string | URL | globalThis.Request, init?: RequestInit): Promise<Response>;
	};

	namespace App {
		interface Locals {
			user: import('lucia').User | null;
			session: import('lucia').Session | null;
			lang: Language;
			theme: string;
		}
	}
	var _db: import('$lib/server/db/database').Database;
	var _prisma: import('@prisma/client').PrismaClient;
	var _rpd_limiter: import('$lib/server/ratelimiter').SlidingWindowCounter;
	var _rpm_limiter: import('$lib/server/ratelimiter').SlidingWindowCounter;
}

export {};
