import { dev } from '$app/environment';
import { PrismaClient } from '@prisma/client';

globalThis.__prisma;

const prisma: PrismaClient = globalThis.__prisma || new PrismaClient();

if (dev) {
	globalThis.__prisma = prisma;
}

export { prisma };
