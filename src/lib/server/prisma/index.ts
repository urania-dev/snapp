import { PrismaClient } from '@prisma/client';

if (!globalThis._prisma) globalThis._prisma = new PrismaClient();
const prisma = globalThis._prisma;

export { prisma };
