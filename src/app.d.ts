import '@auth/sveltekit';
import type { _RedisClient } from '$lib/db';

declare module '@auth/sveltekit' {
	interface User {
		/** comment **/
		id: string;
	}
	interface Session {
		user: {
			id: string;
		};
	}
}
declare module '@auth/core/types' {
	interface User {
		/** comment **/
		id: string;
	}
	interface Session {
		user: {
			id: string;
		};
	}
}

declare global {
	var _redis: _RedisClient;

	namespace App {
		// interface Error {}
		interface Locals {
			theme: 'dark' | 'light' | string;
			lang: string;
		}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}
	namespace svelteHTML {
		interface HTMLAttributes<T> {
		  'on:long'?: (event: Event) => void
		}
	  }
}

export {};
