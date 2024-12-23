import { prisma } from "$lib/server/prisma";
import { database } from "../database";
import {
  EMAIL_EXISTS,
  USER_DOES_NOT_EXISTS,
  USER_EXISTS,
} from "$lib/utils/constants";

export const update_user = async (payload: Partial<User>, id: string) => {
  const existing = await database.users.id(id);

  if (!existing) {
    return [null, USER_DOES_NOT_EXISTS] as [null, typeof USER_DOES_NOT_EXISTS];
  }
  const [check_username] = await database.users.one(payload.username);
  const [check_mail] = await database.users.one(undefined, payload.email);
  if (check_username && check_username.id !== id) {
    return [null, USER_EXISTS] as [null, typeof USER_EXISTS];
  }
  if (check_mail && check_mail.id !== id) {
    return [null, EMAIL_EXISTS] as [null, typeof EMAIL_EXISTS];
  }
  const user = await prisma.user.update({
    where: { id },
    data: { ...payload },
  });
  return [user, null] as [User, null];
};
