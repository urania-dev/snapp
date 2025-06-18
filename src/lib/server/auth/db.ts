import type { User } from '@prisma/client';
import type { StringValue } from 'ms';

import { error, type RequestEvent } from '@sveltejs/kit';
import { enhance } from '@zenstackhq/runtime';
import { env } from '$env/dynamic/private';
import { prisma } from '$lib/db/prisma';
import jwt from 'jsonwebtoken';

import { getConfig } from '../config';
import { log } from '../log';

const config = getConfig();

export function createToken(payload: User, expiresIn?: StringValue): string {
	return jwt.sign(
		{
			...payload,
			sub: payload.id,
			userId: payload.id
		},
		config['TOKEN_SECRET'] as string,
		{ expiresIn: expiresIn ?? '7d' }
	);
}

export const getPrisma = ({ locals, request }: RequestEvent) => {
	const token = request.headers.get('authorization')?.split('Bearer ')?.[1]?.toString();
	try {
		const user = jwt.verify(token || 'Authentication token', config['TOKEN_SECRET'] as string) as {
			role: string;
			userId: string;
		};
		return enhance(prisma, {
			user: user && 'userId' in user ? { id: user?.userId } : undefined
		});
	} catch (e) {
		if (env.DEBUG) log.error(e);
		if (locals.user) return enhance(prisma, { user: locals.user });
		throw error(403, {
			message: 'This is a private service. Please provide correct credentials'
		});
	}
};
