import { prisma } from "$lib/server/prisma";
import jwt from "jsonwebtoken";
import { env } from "$env/dynamic/private";

export const get_token = async (userId: string) => {
  const token = await prisma.token.findFirst({
    where: { userId },
    include: { user: { select: { role: true } } },
  });
  if (token) {
    return {
      key: token.key,
      userId: token.userId,
      created: token.created,
      jwt: jwt.sign(token, env.TOKEN_SECRET),
    };
  } else return null;
};
