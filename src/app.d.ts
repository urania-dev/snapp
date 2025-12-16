// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
	type Auth = import('$lib/auth/server').AuthInstance['$Infer']
	type Fetch = typeof fetch;
	type Session = Auth['Session']['session'];
	type User = Auth['Session']['user'];
	namespace App {
		// interface Error {}
		interface Locals {
			session: null | Session;
			user: null | User;
		}
		interface PageData {
			fetch: Fetch;
			user: User;
		}
		// interface PageState {}
		// interface Platform {}
	}
}
export {};
