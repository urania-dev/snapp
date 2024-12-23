import { lucia } from "$lib/server/auth";
import type { Cookies } from "@sveltejs/kit";
import type { User } from "lucia";
import { prisma } from "$lib/server/prisma";

export const validate_otp = async (
  cookies: Cookies,
  user: User,
  sessionId: string,
) => {
  await prisma.session.delete({ where: { id: sessionId } });
  if (cookies) {
    const session = await lucia.createSession(user.id, {
      two_factor_verified: true,
    }, { sessionId });
    const sessionCookie = lucia.createSessionCookie(session.id);
    cookies.set(sessionCookie.name, sessionCookie.value, {
      path: ".",
      ...sessionCookie.attributes,
    });
  }
};
