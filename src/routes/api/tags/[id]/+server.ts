import { error, json } from '@sveltejs/kit';
import { defineEndpoint } from '@uraniadev/sveltekit-valibot-openapi';
import { m } from '$lib/paraglide/messages';
import { authenticateAPI } from '$lib/server/api/authenticate.js';
import { CONSTANTS } from '$lib/server/const.js';
import { db } from '$lib/server/db';
import { tag } from '$lib/server/db/schema.js';
import { eq } from 'drizzle-orm';
import * as v from 'valibot';

const TagSchema = v.object({
	id: v.string(),
	tag: v.string()
});

export const GET = async ({ params: { id } }) => {
	try {
		await authenticateAPI(); // any authenticated client can read a single tag

		if (!id) throw error(404, { message: m.errors_not_found() });

		const [existing] = await db.select().from(tag).where(eq(tag.id, id));

		if (!existing) throw error(404, { message: m.errors_not_found() });

		return json(existing);
	} catch (err) {
		if (CONSTANTS.DEBUG) console.error('Reading tag', err);
		throw error((err as { statusCode?: number })?.statusCode || 500, {
			message:
				(err as { body?: { message?: string } })?.body?.message ||
				(err as { message?: string })?.message ||
				m.errors_generic()
		});
	}
};

export const DELETE = async ({ params: { id } }) => {
	try {
		await authenticateAPI(); // any authenticated user can attempt to delete

		if (!id) throw error(404, { message: m.errors_not_found() });

		const [existing] = await db.select().from(tag).where(eq(tag.id, id));

		if (!existing) throw error(404, { message: m.errors_not_found() });

		const usage = await db.query.urlToTag.findFirst({
			where: { tag: { id } }
		});

		if (usage) {
			throw error(409, { message: m.api_tag_delete_conflict() });
		}

		await db.delete(tag).where(eq(tag.id, id));

		return json(null, { status: 204 });
	} catch (err) {
		if (CONSTANTS.DEBUG) console.error('Deleting tag', err);
		throw error((err as { statusCode?: number })?.statusCode || 500, {
			message:
				(err as { body?: { message?: string } })?.body?.message ||
				(err as { message?: string })?.message ||
				m.errors_generic()
		});
	}
};

export const fallback = () => {
	throw error(405);
};

export const _openapi = {
	DELETE: defineEndpoint({
		description: m.api_tag_delete_description(),
		method: 'DELETE',
		responses: {
			204: { description: m.deleted() },
			401: { description: m.errors_unauthorized() },
			404: { description: m.errors_not_found() },
			409: { description: m.api_tag_delete_conflict() },
			500: { description: m.errors_generic() }
		},
		summary: m.api_tag_delete_summary(),
		tags: ['Tags']
	}),
	GET: defineEndpoint({
		description: m.api_tag_get_description(),
		method: 'GET',
		responses: {
			200: {
				description: m.api_tag_get_success(),
				schema: TagSchema
			},
			401: {
				description: m.errors_unauthorized()
			},
			404: {
				description: m.errors_not_found()
			},
			500: {
				description: m.errors_generic()
			}
		},
		summary: m.api_tag_get_summary(),
		tags: ['Tags']
	})
} as const;
