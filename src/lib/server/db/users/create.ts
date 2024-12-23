import { EMAIL_EXISTS, USER_EXISTS } from "$lib/utils/constants";
import { prisma } from "$lib/server/prisma";
import { generateId } from "lucia";
import { hash } from "@node-rs/argon2";
import type { Cookies } from "@sveltejs/kit";
import { lucia } from "$lib/server/auth";
import { database } from "../database";

const create_user = async (
  username: string,
  email: string,
  password: string,
  cookies?: Cookies,
  role: "user" | "admin" | "root" = "user",
) => {
  const [_, usernameTaken, emailTaken] = await database.users.one(
    username,
    email,
  );
  if (usernameTaken === true) {
    return [null, USER_EXISTS] as [null, typeof USER_EXISTS];
  }
  if (emailTaken === true) {
    return [null, EMAIL_EXISTS] as [null, typeof EMAIL_EXISTS];
  }
  const password_hash = await hash(password, {
    // recommended minimum parameters
    memoryCost: 19456,
    timeCost: 2,
    outputLen: 32,
    parallelism: 1,
  });

  const { password_hash: __, ...user } = await prisma.user.create({
    data: {
      id: generateId(8),
      username,
      email,
      password_hash,
      role,
      two_factor_secret: null,
    },
  });

  if (cookies) {
    const session = await lucia.createSession(user.id, {
      two_factor_verified: false,
    });
    const sessionCookie = lucia.createSessionCookie(session.id);
    cookies.set(sessionCookie.name, sessionCookie.value, {
      path: ".",
      ...sessionCookie.attributes,
    });
  }

  return [user, null] as [User, null];
};

export { create_user };
