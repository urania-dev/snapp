import { redirect } from '@sveltejs/kit';
import { getHost } from '$lib/remotes/config.remote';
export const load = async () => {
	const host = await getHost();
	if (host.options.disable.homepage) redirect(307, host.options.customRedirect || '/dashboard');
};
