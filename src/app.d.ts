// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
	namespace App {
		// interface Error {}
		interface Locals {
			lang: string;
			prisma: import('@prisma/client').PrismaClient;
			session: import('@prisma/client').Session | null;
			theme: string;
			user: import('@prisma/client').User | null;
		}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}

	declare module '*.md';
}

export {};
