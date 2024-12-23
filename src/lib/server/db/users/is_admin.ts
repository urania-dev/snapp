import { prisma } from "$lib/server/prisma";

export const is_admin = async (userId: string) => {
  const role = (await prisma.user.findFirst({ where: { id: userId } }))?.role ||
    "user";
  return ["admin", "root"].includes(role);
};
