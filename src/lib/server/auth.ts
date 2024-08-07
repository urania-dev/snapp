import { Lucia } from 'lucia';

import { PrismaAdapter } from '@lucia-auth/adapter-prisma';
import { prisma } from '$lib/server/prisma';

const adapter = new PrismaAdapter(prisma.session, prisma.user);

export const lucia = new Lucia(adapter, {
	sessionCookie: {
		attributes: {
			// set to `true` when using HTTPS
			secure: process.env.NODE_ENV !== 'development'
		}
	},
	getUserAttributes: (attributes) => {
		return {
			// attributes has the type of DatabaseUserAttributes
			username: attributes.username,
			email: attributes.email,
			role: attributes.role,
			createdAt: attributes.createdAt,
			updatedAt: attributes.updatedAt,
			notes: attributes.notes
		};
	}
});

declare module 'lucia' {
	interface Register {
		Lucia: typeof lucia;
		DatabaseUserAttributes: DatabaseUserAttributes;
	}
}

interface DatabaseUserAttributes {
	username: string;
	email: string;
	role: 'user' | 'admin' | 'root';
	updatedAt: Date;
	createdAt: Date;
	notes: string;
}

declare module 'lucia' {
	interface Register {
		Lucia: typeof lucia;
	}
}
