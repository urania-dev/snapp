import { prisma } from "$lib/server/prisma";

export const is_admin_token = async (token: string) => {
  const role = (
    await prisma.token.findFirst({
      where: { key: token },
      include: { user: { select: { role: true } } },
    })
  )?.user?.role || "user";
  return ["admin", "root"].includes(role);
};
