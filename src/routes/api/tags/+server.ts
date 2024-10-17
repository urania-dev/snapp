import { authenticate_api } from '$lib/server/authenticate-api/index.js';
import { database } from '$lib/server/db/database.js';
import { prisma } from '$lib/server/prisma';
import { rateLimiterCheck } from '$lib/server/ratelimiter/index.js';
import { error, json, } from '@sveltejs/kit';

export const GET = async (event) => {
    const token = await authenticate_api(event);
    if (!token) error(403);
    const limits = token.user.role === 'user' ? await rateLimiterCheck(token.key) : null;
    if (limits?.blocked) return json({ message: 'Too many requests' }, { status: 429 });

    const userId = event.url.searchParams.get('userId')?.toString() || undefined;
    const limit = parseInt(event.url.searchParams.get('limit')?.toString() || '10');
    const offset = parseInt(event.url.searchParams.get('offset')?.toString() || '0');
    const query = event.url.searchParams.get('query')?.toString();
    const orderBy = event.url.searchParams.get('order-by')?.toString() || undefined;
    const ascending = event.url.searchParams.get('ascending')?.toString() === 'true' || false;

    const [tags, count] = await database.tags.get(
        token.user.role === 'user' ? token.userId : userId,
        query,
        limit,
        offset,
        orderBy
            ? {
                [orderBy]: ascending ? 'asc' : 'desc'
            }
            : undefined
    );

    return json({ tags, total: count, pagination: { limit, offset, query, orderBy, ascending } });
};

export const POST = async (event) => {
    const token = await authenticate_api(event);
    if (!token) error(403);
    const limits = token.user.role === 'user' ? await rateLimiterCheck(token.key) : null;
    if (limits?.blocked) return json({ message: 'Too many requests' }, { status: 429 });

    const {
        name,
        slug,
        notes,
        userId
    }: {
        name: string,
        slug: string,
        notes?: string;
        userId?: string;
    } = await event.request.json();

    if (!name) return error(400, { message: 'Missing tag name' });
    if (!userId) return error(400, { message: 'Missing userId' })
    if (userId && token.user.role === 'user')
        return error(403, { message: "You're not allowed to create tags for someone else" });

    const tag = await database.tags.create(
        userId, name, slug, notes
    );


    return json(tag);
};

export const PATCH = async (event) => {
    const token = await authenticate_api(event);
    if (!token) error(403);
    const limits = token.user.role === 'user' ? await rateLimiterCheck(token.key) : null;
    if (limits?.blocked) return json({ message: 'Too many requests' }, { status: 429 });


    const {
        id,
        name,
        slug,
        notes,
        userId
    }: {
        id: string,
        name: string,
        slug: string,
        notes?: string;
        userId?: string;
    } = await event.request.json();


    if (!id) return error(400, { message: 'Missing Tag ID' });
    const is_admin = token.user.role !== 'user';
    const editable = await prisma.tag.findFirst({
        where: { id, users: { some: { id: is_admin ? undefined : userId } } }
    });

    if (!editable) return error(404, { message: 'Tag not found' });

    const tag = await database.tags.edit(
        token.userId,
        name,
        slug,
        notes,
        id
    );

    return json(tag);
};

export const DELETE = async (event) => {
    const token = await authenticate_api(event);
    if (!token) error(403);
    const limits = token.user.role === 'user' ? await rateLimiterCheck(token.key) : null;
    if (limits?.blocked) return json({ message: 'Too many requests' }, { status: 429 });
    const { ids } = Object.fromEntries(event.url.searchParams); // ids is a string of "id, id, id"

    for (let id of ids) {

        const [count, err] = await database.tags.delete(id);
        if (!count || err) error(500, { message: 'System error' });
    }

    return json({ success: true });
};

export const fallback = () => error(405);
