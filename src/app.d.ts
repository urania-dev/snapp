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

	type Setting = {
		id: string;
		field: string;
		value: string;
		userId: string | null;
		created: Date;
	};

	type Snapp = {
		id: string;
		shortcode: string;
		original_url: string;
		created: Date;
		secret: string | null;
		max_usages: number;
		hit: number;
		used: number;
		notes: string | null;
		expiration: Date | null;
		disabled: boolean;
		userId: string;
	};

	type User = {
		id: string;
		username: string;
		password_hash: string;
		email: string;
		notes: string | null;
		role: string;
		createdAt: Date;
		updatedAt: Date;
	};

	type Token = {
		key: string;
		userId: string;
		created: Date;
	};

	type Watchlist = {
		id: string;
		created: Date;
		username: string | null;
		domain: string | null;
		allowed: boolean;
	};
}

export {};
