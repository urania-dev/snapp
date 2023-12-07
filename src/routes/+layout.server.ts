import { prisma } from '$lib/server/prisma.js';

export async function load({ locals, depends }) {
	depends('u:snappli:theme');
	const session = await locals.auth.validate();

	const theme = await prisma.settings.findFirst({
		where: {
			user_id: session?.user.userId,
			setting: 'theme'
		}
	});

	return {
		session,
		_theme: theme ? theme.value : 'dark',
		is_demo: process.env.DEMO === 'true',
		disable_home: process.env.DISABLE_HOME === 'true',
		website_id: process.env.WEBSITE_ID
	};
}
