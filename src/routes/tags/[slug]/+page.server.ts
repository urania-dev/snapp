import { database } from '$lib/server/db/database';
import { prisma } from '$lib/server/prisma/index.js'
import { getServerSideSettings } from '$lib/server/server-wide-settings';
import { TAGS_AS_PREFIX } from '$lib/utils/constants.js';
import { fail, redirect } from '@sveltejs/kit';

export const load = async ({ locals: { session, user }, params: { slug }, url }) => {
    if (!session || !user) redirect(302, '/')


    const customLimit = await database.settings
        .get('SNAPP_IN_TAGS_ROWS', user.id)
        .then((res) => (res?.value && parseInt(res.value)) || -1);
    const limit =
        customLimit !== -1 ? customLimit : parseInt(url.searchParams.get('limit')?.toString() || '4');
    const page = parseInt(url.searchParams.get('page')?.toString() || '1');
    let orderBy = url.searchParams.get('order-by')?.toString() || 'created';
    const ascending =
        url.searchParams.get('ascending')?.toString()?.toLowerCase() === 'false' || false;
    const offset = (page - 1) * limit;

    const is_admin = await database.users.is_admin(user.id)

    const query = url.searchParams.get('query')?.toString();

    const tag = await prisma.tag.findFirst({
        where: { slug }, include: {
            _count: true,
            users: {
                select: { username: true, id: true }
            },
            snapps: {
                where: {
                    disabled: false, secret: null, OR: query ? [{
                        shortcode: { contains: query }
                    }] : undefined
                },
                select: {
                    _count: true,
                    id: true,
                    shortcode: true,
                    created: true,
                    expiration: true,
                    secret: true,
                    userId: true,
                    user: {
                        select: {
                            username: true
                        }
                    }
                },
                orderBy: orderBy === 'users' ? {
                    user: {
                        username: ascending ? 'asc' : 'desc'
                    }
                } : { [orderBy]: ascending ? 'asc' : 'desc' },
                take: limit,
                skip: offset
            },
        },

    }).then(t => ({
        ...t, snapps: t ? t.snapps.map(s => ({ ...s, secret: s.secret !== null })) : []
    }))
    const settings = getServerSideSettings()
    const tagsAsPrefix = settings.get(TAGS_AS_PREFIX)

    const cols = await database.settings
        .get('SNAPP_IN_TAGS_COLUMNS', user.id)
        .then((res) => (res?.value && (JSON.parse(res.value) as string[])) || []);


    const userQuery = url.searchParams.get('user-query')?.toString();

    const [users, userCount] = is_admin ? await database.users.get(userQuery, 5, 0) : [[], 0]

    return { tag, limit, page, orderBy, ascending, offset, query, cols, tagsAsPrefix, users }
}

export const actions = {
    "handle-user": async ({ locals: { session, user }, request, params: { slug }, fetch }) => {
        const settings = getServerSideSettings()
        if (!session) redirect(302, '/');
        const form = await request.formData();
        const userId = form.get('id')?.toString() || null
        const userAction = form.get('action')?.toString() || null
        if (!userId) return fail(400, { message: "errors.generic" })
        if (userAction === "connect") {
            await prisma.tag.update({ where: { slug }, data: { users: { connect: { id: userId } } } })
        }
        if (userAction === "disconnect") await prisma.tag.update({ where: { slug }, data: { users: { disconnect: { id: userId } } } })

        return { message: "settings.saved" }
    },
    'save-cols': async ({ locals: { session, user }, request }) => {
        if (!session || !user) redirect(302, '/');
        const form = await request.formData();

        const cols = form.get('columns')?.toString();
        if (cols) await database.settings.set('SNAPP_IN_TAGS_COLUMNS', cols, user.id);
    },
    'save-rows': async ({ locals: { session, user }, request }) => {
        if (!session || !user) redirect(302, '/');
        const form = await request.formData();
        const cols = form.get('rows')?.toString();
        if (cols) await database.settings.set('SNAPP_IN_TAGS_ROWS', cols, user.id);
    }
}