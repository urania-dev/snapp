import { lucia } from 'lucia';
import { sveltekit } from 'lucia/middleware';
import { prisma as PrismaAdapter } from '@lucia-auth/adapter-prisma';
import { prisma } from './prisma';

export const auth = lucia({
	adapter: PrismaAdapter(prisma),
	env: process.env.NODE_ENV && process.env.NODE_ENV === 'development' ? 'DEV' : 'PROD',
	middleware: sveltekit(),
	getUserAttributes: (data) => {
		return {
			username: data.username
		};
	}
});

export type Auth = typeof auth;
