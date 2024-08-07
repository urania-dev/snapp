import { prisma } from '$lib/server/prisma';

export const set_watchlist = async (
	domain?: string,
	username?: string,
	allowed: boolean = false
) => {
	const id =
		domain && username
			? `${domain}:` + `${username}`
			: domain
				? `domain:${domain}`
				: username
					? `username:${username}`
					: undefined;
	if (!id) return;
	await prisma.watchlist.upsert({
		where: { id },
		create: { domain, username, allowed, id },
		update: { allowed }
	});
};
