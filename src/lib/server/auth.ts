import { Lucia } from "lucia";
import { PrismaAdapter } from "@lucia-auth/adapter-prisma";
import { prisma } from "$lib/server/prisma";

const adapter = new PrismaAdapter(prisma.session, prisma.user);

export const lucia = new Lucia(adapter, {
  sessionCookie: {
    attributes: {
      // set to `true` when using HTTPS
      secure: process.env.NODE_ENV !== "development",
    },
  },
  getUserAttributes: (attributes) => {
    return {
      // attributes has the type of DatabaseUserAttributes
      username: attributes.username,
      email: attributes.email,
      role: attributes.role,
      createdAt: attributes.createdAt,
      updatedAt: attributes.updatedAt,
      notes: attributes.notes,
      setupTwoFactor: typeof attributes.two_factor_secret === "string",
    };
  },
  getSessionAttributes: (attributes) => {
    return {
      twoFactorVerified: attributes.two_factor_verified,
    };
  },
});

declare module "lucia" {
  interface Register {
    Lucia: typeof lucia;
    DatabaseUserAttributes: DatabaseUserAttributes;
    DatabaseSessionAttributes: DatabaseSessionAttributes;
  }
}

interface DatabaseUserAttributes {
  username: string;
  email: string;
  role: "user" | "admin" | "root";
  updatedAt: Date;
  createdAt: Date;
  notes: string;
  two_factor_secret: string | null;
}
interface DatabaseSessionAttributes {
  two_factor_verified: boolean;
}

declare module "lucia" {
  interface Register {
    Lucia: typeof lucia;
  }
}
