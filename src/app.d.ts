/// <reference types="lucia" />
declare global {
	type Columns = 'original-url' | 'short-code' | 'created-at' | 'expires-at' | 'status' | 'usages';

	namespace App {
		// interface Error {}
		interface Locals {
			auth: import('lucia').AuthRequest;
		}
		// interface PageData {}
		// interface Platform {}
	}
	namespace Lucia {
		type Auth = import('$lib/server/lucia').Auth;
		type DatabaseUserAttributes = {
			username: string;
			email: string|null
		};
		type DatabaseSessionAttributes = {};
	}
	var __prisma: PrismaClient;
}

export {};
