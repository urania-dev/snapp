import { prisma } from "$lib/server/prisma";
import { env } from "$env/dynamic/private";
import { generateId } from "lucia";
import jwt from "jsonwebtoken";

export const create_token = async (userId: string) => {
  await prisma.token.deleteMany({ where: { userId } });
  const { key } = await prisma.token.create({
    data: { key: generateId(32), userId },
  });
  const token = await prisma.token.findFirst({
    where: { key },
    include: { user: { select: { role: true, id: true } } },
  });
  if (token) return jwt.sign(token, env.TOKEN_SECRET);
};
