import { prisma } from "$lib/server/prisma";

export const delete_token = async (userId: string) => {
  await prisma.token.deleteMany({ where: { userId } });
};
