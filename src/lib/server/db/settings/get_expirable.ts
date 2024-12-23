import { prisma } from "$lib/server/prisma";

const get_expirable_setting = async (
  field: string,
  expiration: Date,
  userId?: string,
) => {
  expiration.setHours(0, 0, 0, 0);
  await prisma.setting.deleteMany({ where: { created: { lte: expiration } } });
  const id = `${field}${(userId && ":" + userId) || ""}`;
  return await prisma.setting.findFirst({ where: { id } });
};

export { get_expirable_setting };
