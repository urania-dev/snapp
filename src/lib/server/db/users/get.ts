import { prisma } from "$lib/server/prisma";

export const get_users = async (
  query?: string,
  limit: number = 10,
  offset: number = 0,
) => {
  const users = await prisma.user.findMany({
    where: {
      OR: query
        ? [
          {
            username: {
              contains: query,
            },
          },
          {
            email: {
              contains: query,
            },
          },
          {},
        ]
        : undefined,
    },
    include: {
      _count: {
        select: {
          snapps: true,
        },
      },
    },
    take: limit,
    skip: offset,
  });

  const count = await prisma.user.count();

  return [users, count] as [typeof users, number];
};
