import { prisma } from "$lib/server/prisma";

export const count_watchlisted = async (
  allowed?: boolean,
  username?: string | object,
  domain?: string | object,
) => {
  return await prisma.watchlist.count({ where: { allowed, username, domain } });
};
