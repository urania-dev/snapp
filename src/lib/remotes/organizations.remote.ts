import { error } from '@sveltejs/kit';
import { dev } from '$app/environment';
import { command, form, getRequestEvent } from '$app/server';
import { authCache, getBetterAuth } from '$lib/auth/server';
import { m } from '$lib/paraglide/messages';
import { PermissionSchema } from '$lib/schemas/host.schema';
import { CONSTANTS } from '$lib/server/const';
import { db } from '$lib/server/db';
import { organizationRole } from '$lib/server/db/auth-schema';
import { settings } from '$lib/server/settings';
import { cleanupOrphanFolders } from '$lib/server/utils';
import { slugify } from '$lib/utils';
import { eq } from 'drizzle-orm';
import { randomUUID } from 'node:crypto';
import fs from 'node:fs';
import * as v from 'valibot';

import { requireUser } from './auth.remote';
export const deleteOrganizations = command(v.array(v.string()), async (ids) => {
	await requireUser();
	const { request, url } = getRequestEvent();
	const config = settings.get();
	let origin = url.origin;
	if (dev) origin = origin.replace('http:', 'https:');
	const host = config.hosts.find((h) => h.origin === origin);
	if (!host) throw error(400, { message: m.errors_unrecognized_host() });
	try {
		const auth = await getBetterAuth(host);
		const res = await Promise.all(
			ids.map(async (id) =>
				auth.api.deleteOrganization({ body: { organizationId: id }, headers: request.headers })
			)
		);
		res
			.map((r) => JSON.parse(r?.metadata || '{}')?.origin as string)
			.map((o) => {
				authCache.auth.delete(slugify(o));
				settings.set({ ...config, hosts: config.hosts.filter((h) => h.origin !== o) });
			});

		authCache.roles.delete(slugify(host.origin));
		authCache.auth.delete(slugify(host.origin));
		return true;
	} catch (error) {
		if (CONSTANTS.DEBUG) console.error(error);
		return false;
	}
});
export const deleteTeams = command(v.array(v.string()), async (ids) => {
	await requireUser();
	const { request, url } = getRequestEvent();
	const config = settings.get();
	let origin = url.origin;
	if (dev) origin = origin.replace('http:', 'https:');
	const host = config.hosts.find((h) => h.origin === origin);
	if (!host) throw error(400, { message: m.errors_unrecognized_host() });
	try {
		const auth = await getBetterAuth(host);
		type Permission = Record<string, ['create' | 'delete' | 'read' | 'update']>;
		const roles = (
			await db.query.organizationRole.findMany({
				where: { organizationId: slugify(host.origin) }
			})
		).map((r) => ({
			id: r.id,
			oid: r.organizationId,
			permission: JSON.parse(r.permission) as Permission,
			role: r.role
		}));
		const updatedRoles = roles.map((r) => ({
			...r,
			permission: Object.fromEntries(Object.entries(r.permission).filter(([p]) => !ids.includes(p)))
		}));
		await Promise.all([
			...updatedRoles.map(async (r) => {
				return await db
					.update(organizationRole)
					.set({ permission: JSON.stringify(r.permission) })
					.where(eq(organizationRole.id, r.id));
			}),
			...ids.map(async (id) => {
				await auth.api.removeTeam({
					body: { teamId: id },
					headers: request.headers
				});
			})
		]);
		authCache.roles.delete(slugify(host.origin));
		authCache.auth.delete(slugify(host.origin));
		return true;
	} catch (error) {
		if (CONSTANTS.DEBUG) console.error(error);
		return false;
	}
});

const CreateOrganizationSchema = v.pipeAsync(
	v.objectAsync({
		name: v.pipe(v.string(m.errors_non_empty()), v.nonEmpty(m.errors_non_empty())),
		origin: v.pipe(v.string(m.errors_non_empty()), v.url(m.errors_url_invalid())),
		slug: v.pipeAsync(
			v.string(m.errors_non_empty()),
			v.nonEmpty(m.errors_non_empty()),
			v.checkAsync(async (slug) => {
				await requireUser();
				const { request, url } = getRequestEvent();
				const config = settings.get();
				let origin = url.origin;
				if (dev) origin = origin.replace('http:', 'https:');
				const host = config.hosts.find((h) => h.origin === origin);
				if (!host) throw error(400, { message: m.errors_unrecognized_host() });
				try {
					const auth = await getBetterAuth(host);
					await auth.api.checkOrganizationSlug({ body: { slug }, headers: request.headers });
					return true;
				} catch (error) {
					if (CONSTANTS.DEBUG) console.error(error);
					return false;
				}
			}, m.errors_slug_unavailable())
		)
	})
);

export const createOrganization = form(CreateOrganizationSchema, async ({ name, origin }) => {
	await requireUser();
	const { request, url } = getRequestEvent();
	const config = settings.get();
	let _origin = url.origin;
	if (dev) _origin = _origin.replace('http:', 'https:');
	const host = config.hosts.find((h) => h.origin === _origin);
	if (!host) throw error(400, { message: m.errors_unrecognized_host() });
	try {
		const auth = await getBetterAuth(host);
		await auth.api.createOrganization({
			body: {
				keepCurrentActiveOrganization: true,
				metadata: { origin },
				name,
				slug: slugify(name)
			},
			headers: request.headers
		});

		settings.set({
			...config,
			hosts: [
				...config.hosts,
				{
					options: {
						customRedirect: '/dashboard',
						disable: {
							homepage: false,
							limits: true,
							signup: false,
							twoFactor: true
						}
					},
					origin
				}
			]
		});
		return true;
	} catch (error) {
		if (CONSTANTS.DEBUG) console.error(error);
		return false;
	}
});

const CreateTeamSchema = v.pipeAsync(
	v.objectAsync({
		name: v.pipe(v.string(m.errors_non_empty()), v.nonEmpty(m.errors_non_empty())),
		organizationId: v.string(),
		permissions: v.pipe(
			v.string(),
			v.transform((str) => {
				return JSON.parse(str) as { [key: string]: ['create' | 'delete' | 'read' | 'update'] };
			})
		)
	})
);

export const createTeam = form(CreateTeamSchema, async ({ name, organizationId, permissions }) => {
	const user = await requireUser();

	const { request, url } = getRequestEvent();
	const config = settings.get();

	let origin = url.origin;
	if (dev) origin = origin.replace('http:', 'https:');

	const host = config.hosts.find((h) => h.origin === origin);
	if (!host) throw error(400, { message: m.errors_unrecognized_host() });

	try {
		const auth = await getBetterAuth(host);

		const hasPermission = await auth.api.hasPermission({
			body: {
				organizationId: slugify(host.origin),
				permissions: {
					team: ['create']
				}
			},
			headers: request.headers
		});
		if (!hasPermission.success) error(403, { message: m.errors_unauthorized() });
		const team = await auth.api.createTeam({
			body: {
				name,
				organizationId: organizationId
			},
			headers: request.headers
		});

		await auth.api.addTeamMember({
			body: { teamId: team.id, userId: user.id },
			headers: request.headers
		});
		const roles = await db.query.organizationRole.findMany({
			where: { organizationId: slugify(host.origin) }
		});

		await Promise.all(
			roles.map(async (r) => {
				const parsed = v.parse(PermissionSchema, JSON.parse(r.permission));
				const updated = {
					...parsed,
					[team.id]: permissions[r.role]
				};
				await db
					.update(organizationRole)
					.set({
						permission: JSON.stringify(updated)
					})
					.where(eq(organizationRole.id, r.id));
			})
		);

		authCache.roles.delete(slugify(host.origin));
		authCache.auth.delete(slugify(host.origin));
		return true;
	} catch (err) {
		if (CONSTANTS.DEBUG) console.error(err);
		return false;
	}
});

export const updatePermissions = command(v.array(v.object({id:v.string(),p:PermissionSchema})), async (roles) => {
	await requireUser();

	const { request, url } = getRequestEvent();
	const config = settings.get();

	let origin = url.origin;
	if (dev) origin = origin.replace('http:', 'https:');

	const host = config.hosts.find((h) => h.origin === origin);
	if (!host) throw error(400, { message: m.errors_unrecognized_host() });
	const auth = await getBetterAuth(host);

	try {
		const hasPermission = await auth.api.hasPermission({
			body: {
				organizationId: slugify(host.origin),
				permissions: {
					team: ['update']
				}
			},
			headers: request.headers
		});
		if (!hasPermission.success) error(403, { message: m.errors_unauthorized() });
		await Promise.all(
			roles.map(async (r) => {
					await db
					.update(organizationRole)
					.set({
						permission: JSON.stringify(r.p)
					})
					.where(eq(organizationRole.id, r.id))
				})
		);
		authCache.roles.delete(slugify(host.origin));
		authCache.auth.delete(slugify(host.origin));
		return true;
	} catch (err) {
		if (CONSTANTS.DEBUG) console.error(err);
		return false;
	}
});


export const saveLogo = command(
	v.object({ file: v.string(), id: v.string() }),
	async ({ file, id }) => {
		await cleanupOrphanFolders('config/logos');

		const directory = `config/logos/${id}`;
		const base64 = file.replace(/^data:image\/\w+;base64,/, '');
		const buffer = Buffer.from(base64, 'base64');

		fs.rmSync(directory, { force: true, recursive: true });
		fs.mkdirSync(directory, { recursive: true });

		const filenameWithExt = `${randomUUID()}.webp`;
		const filename = `${directory}/${filenameWithExt}`;

		fs.writeFileSync(filename, buffer);

		return { filename: `/logos/${id}/${filenameWithExt}` };
	}
);


