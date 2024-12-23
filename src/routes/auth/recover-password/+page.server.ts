import { fail, redirect } from "@sveltejs/kit";
import { isWithinExpirationDate } from "oslo";
import { hash } from "@node-rs/argon2";
import { sha256 } from "oslo/crypto";
import { encodeHex } from "oslo/encoding";
import { prisma } from "$lib/server/prisma";
import { lucia } from "$lib/server/auth.js";

export const actions = {
  default: async ({ cookies, request, url }) => {
    const form = await request.formData();
    const password = form.get("password")?.toString();
    const confirm_password = form.get("confirm-password")?.toString();
    if (
      !password ||
      typeof password !== "string" ||
      !password.trim().length ||
      !/^(?=.*\d)(?=.*[A-Z])(?=.*[a-z])(?=.*[^\w\d])([^\s]){8,}$/.test(
        password.trim(),
      )
    ) {
      return fail(400, { message: "errors.auth.password-invalid" });
    }
    if (
      !confirm_password ||
      typeof confirm_password !== "string" ||
      !confirm_password.trim().length ||
      confirm_password !== password
    ) {
      return fail(400, { message: "errors.auth.password-unmatch" });
    }

    const verificationToken = url.searchParams.get("token")?.toString();

    const tokenHash = encodeHex(
      await sha256(new TextEncoder().encode(verificationToken)),
    );
    const token = await prisma.password_reset.findFirst({
      where: { token_hash: tokenHash },
    });

    if (token) {
      await prisma.password_reset.delete({ where: { token_hash: tokenHash } });
    }

    if (!token || !isWithinExpirationDate(token.expiresAt)) {
      return fail(400, { message: "errors.auth.reset-token-expired" });
    }

    await lucia.invalidateUserSessions(token.userId);
    const passwordHash = await hash(password, {
      // recommended minimum parameters
      memoryCost: 19456,
      timeCost: 2,
      outputLen: 32,
      parallelism: 1,
    });
    await prisma.user.update({
      where: { id: token.userId },
      data: {
        password_hash: passwordHash,
      },
    });

    const session = await lucia.createSession(token.userId, {
      two_factor_verified: false,
    });
    const sessionCookie = lucia.createSessionCookie(session.id);
    cookies.set(sessionCookie.name, sessionCookie.value, {
      path: ".",
      ...sessionCookie.attributes,
    });

    redirect(302, "/dashboard");
  },
};
