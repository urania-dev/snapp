import { env } from '$env/dynamic/private';
import { prisma } from '$lib/server/prisma.js';

export async function load({ locals, depends }) {
	depends('u:snappli:theme');
	const session = await locals.auth.validate();

	try {
		const theme = await prisma.settings.findFirst({
			where: {
				user_id: session?.user.userId,
				setting: 'theme'
			}
		});
		return {
			session,
			_theme: theme ? theme.value : 'dark',
			is_demo: env.DEMO === 'true',
			disable_home: env.DISABLE_HOME === 'true',
			website_id: env.WEBSITE_ID,
			umami_url: env.UMAMI_URL,
			has_smtp: env.SMTP_HOST !== undefined
		};
	} catch (err) {
		throw err;
	}
}
