import { prisma } from "$lib/server/prisma";

export const delete_settings = async (field: string, userId?: string) => {
  await prisma.setting.deleteMany({ where: { id: field, userId } });
};
