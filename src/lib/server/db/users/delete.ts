import { prisma } from "$lib/server/prisma";
import { database } from "../database";

export const delete_user = async (
  id?: string | null,
  username?: string,
  email?: string,
  roles: ("admin" | "root" | "user")[] = ["root"],
) => {
  const user = id
    ? await database.users.id(id)
    : (await database.users.one(username, email))[0];

  if (!user) return [null, "errors.users.not-found"];
  if (roles.includes(user.role as "root")) return [null, "errors.unauthorized"];
  const _user = await prisma.user.delete({
    where: { id: id ?? user.id, role: { not: { in: roles } } },
  });
  return [_user, null];
};
