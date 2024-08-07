import { authenticate_api } from '$lib/server/authenticate-api/index.js';
import { prisma } from '$lib/server/prisma/index.js';
import { rateLimiterCheck } from '$lib/server/ratelimiter';
import { error, json } from '@sveltejs/kit';

export const GET = async (event) => {
    const token = await authenticate_api(event);
    if (!token) error(403);
    const limits = token.user.role === 'user' ? await rateLimiterCheck(token.key) : null;
    if (limits?.blocked) return json({ message: 'Too many requests' }, { status: 429 });

    const id = event.params.id
    if (token.userId !== id && token.user.role !== 'admin') return error(403, "Forbidden")

    const user = await prisma.user.findFirst({ where: { id } })

    return json(user);
};
export const fallback = () => error(405);
