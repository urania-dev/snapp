import { prisma } from "$lib/server/prisma";

const set_setting = async (field: string, value: string, userId?: string) => {
  const id = `${field}${(userId && ":" + userId) || ""}`;
  return prisma.setting.upsert({
    create: { field, value, userId, id },
    update: { value },
    where: { id, field, userId },
  });
};

export { set_setting };
