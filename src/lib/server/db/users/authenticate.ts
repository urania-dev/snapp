import { PASSWORD_IS_INVALID, USER_DOES_NOT_EXISTS } from '$lib/utils/constants';
import { prisma } from '$lib/server/prisma';

import { verify } from '@node-rs/argon2';
import { lucia } from '$lib/server/auth';
import type { Cookies } from '@sveltejs/kit';
import type { User } from 'lucia';

type ERROR = typeof USER_DOES_NOT_EXISTS | typeof PASSWORD_IS_INVALID;

const authenticate = async (cookies: Cookies, username: string, password: string) => {
	const exists = await prisma.user.findFirst({ where: { username } });
	if (exists === null) return [null, USER_DOES_NOT_EXISTS] as [null, ERROR];
	const validPassword = await verify(exists.password_hash, password, {
		memoryCost: 19456,
		timeCost: 2,
		outputLen: 32,
		parallelism: 1
	});
	if (!validPassword) return [null, PASSWORD_IS_INVALID] as [null, ERROR];
	await prisma.user.update({ where: { id: exists.id }, data: {} }); // updatedAt // last login

	const session = await lucia.createSession(exists.id, {});
	const sessionCookie = lucia.createSessionCookie(session.id);
	cookies.set(sessionCookie.name, sessionCookie.value, {
		path: '.',
		...sessionCookie.attributes
	});

	return [exists, null] as [User, null];
};

export { authenticate };
