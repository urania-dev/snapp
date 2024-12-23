import { PrismaClient } from "@prisma/client";

const selectAdapter = () => {
  if (!globalThis._prisma) globalThis._prisma = new PrismaClient();
  return globalThis._prisma;
};

const prisma = selectAdapter();

export { prisma };
