import { prisma } from "$lib/server/prisma";

export const check_watchlist = async (
  domain: string | null,
  username: string | null,
) => {
  const res = await prisma.watchlist.findFirst({
    where: { OR: [{ domain }, { username, domain }] },
  });
  return (res?.allowed || true) as boolean;
};
