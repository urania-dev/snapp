import { redirect } from '@sveltejs/kit';
import { env } from '$env/dynamic/public';
import { getServerInfo } from '$lib/remotes/config.remote';
import { settings } from '$lib/server/settings/index';
export const load = async ({ depends, locals: { user }, parent }) => {
	depends('auth:user:host');
	if (!user) redirect(307, '/auth/sign-in');
	const data = await parent();

	const config = settings.get();
	const serverInfo = await getServerInfo();
	return { ...data, serverInfo, smtp: env.PUBLIC_BETA ? null :config.smtp, user };
};
