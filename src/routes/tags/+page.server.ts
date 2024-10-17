import { database } from '$lib/server/db/database';
import { prisma } from '$lib/server/prisma/index.js';
import { getServerSideSettings } from '$lib/server/server-wide-settings/index.js';
import { TAGS_AS_PREFIX } from '$lib/utils/constants.js';
import { fail, redirect } from '@sveltejs/kit';

export async function load({ locals: { session, user }, url }) {
    if (!user || !session) redirect(302, '/auth/sign-in');
    const customLimit = await database.settings
        .get('TAGS_ROWS', user.id)
        .then((res) => (res?.value && parseInt(res.value)) || -1);
    const is_admin = await database.users.is_admin(user.id)
    const limit =
        customLimit !== -1 ? customLimit : parseInt(url.searchParams.get('limit')?.toString() || '14');
    const page = parseInt(url.searchParams.get('page')?.toString() || '1');
    const offset = (page - 1) * limit;
    const query = url.searchParams.get('query')?.toString();

    const [tags, count] = await database.tags.get(is_admin ? undefined : user.id, query, limit, offset);

    const cols = await database.settings
        .get('TAGS_COLUMNS', user.id)
        .then((res) => (res?.value && (JSON.parse(res.value) as string[])) || ['name']);

    const rows = await database.settings
        .get('TAGS_ROWS', user.id)
        .then((res) => (res?.value && (JSON.parse(res.value) as number)) || 9);
    const settings = getServerSideSettings()
    const tagsAsPrefix = settings.get(TAGS_AS_PREFIX)
    return { tags, count, query, limit, offset, cols, rows, is_admin, tagsAsPrefix };
}


export const actions = {
    create: async ({ locals: { session }, request, }) => {
        if (!session) redirect(302, '/');
        const form = await request.formData();
        const create_tag = form.get('tag')?.toString() || null;
        if (!create_tag) return fail(400, { message: 'tags.errors.name-invalid' })
        let { name, slug, notes } = JSON.parse(create_tag)

        await database.tags.create(session.userId, name, slug, notes)
        return { message: "tags.helpers.created" }
    },
    edit: async ({ locals: { session }, request, }) => {
        if (!session) redirect(302, '/');
        const form = await request.formData();
        const edit = form.get('tag')?.toString() || null;
        if (!edit) return fail(400, { message: 'tags.errors.name-invalid' })
        let { id, name, slug, notes } = JSON.parse(edit)

        await database.tags.edit(session.userId, name, slug, notes, id)
        return { message: "tags.helpers.created" }
    },
    delete: async ({ locals: { session, user }, request }) => {
        if (!session || !user) redirect(302, '/');
        const is_admin = await database.users.is_admin(user.id)
        if (is_admin) {
            const form = await request.formData();
            const id = form.get('id')?.toString();
            if (!id) return fail(400, { message: 'errors.generic' });
            const [u, err] = await database.tags.delete(id);
            return { message: err ? "errors.generic" : 'tags.helpers.deleted' };
        } else return { message: "errors.unauthorized" }
    },
    "delete-all": async ({ locals: { session, user }, request }) => {
        if (!session || !user) redirect(302, '/');

        const form = await request.formData();
        const ids = form.get('ids')?.toString() && JSON.parse(form.get('ids')!.toString());

        for (let id of ids) {
            await database.tags.delete(id);
        }


        return { message: 'tags.helpers.deleted', success: true };
    },
    'save-cols': async ({ locals: { session, user }, request }) => {
        if (!session || !user) redirect(302, '/');
        const form = await request.formData();

        const cols = form.get('columns')?.toString();
        if (cols) await database.settings.set('TAGS_COLUMNS', cols, user.id);
    },
    'save-rows': async ({ locals: { session, user }, request }) => {
        if (!session || !user) redirect(302, '/');
        const form = await request.formData();

        const cols = form.get('rows')?.toString();
        if (cols) await database.settings.set('TAGS_ROWS', cols, user.id);
    }
}