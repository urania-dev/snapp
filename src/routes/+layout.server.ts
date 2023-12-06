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


	return { session, _theme: theme ? theme.value : 'dark' };
}
