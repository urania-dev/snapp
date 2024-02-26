import { browser } from '$app/environment';
import { signOut } from '@auth/sveltekit/client';

export async function load({ data, fetch }) {
	if (browser && data.session && data.user === null) await signOut();
	
	return { ...data, fetch };
}
