import { sequence } from '@sveltejs/kit/hooks';
import { roles } from '$lib/auth/permissions';
import { getBetterAuth } from '$lib/auth/server';
import { CONSTANTS } from '$lib/server/const';
import { db } from '$lib/server/db';
import dbHandle from '$lib/server/db/db-handle';
import { member, organization, organizationRole } from '$lib/server/db/schema';
import betterAuthHandle, { handle2fa } from '$lib/server/handles/better-auth.handle';
import paraglideHandle from '$lib/server/handles/paraglide.handle';
import { settings } from '$lib/server/settings';
import { slugify } from '$lib/utils';
import { generateId } from 'better-auth';
import { generateRandomString } from 'better-auth/crypto';
import { sql } from 'drizzle-orm';
import { execSync } from 'node:child_process';
import fs from 'node:fs';

export const _uptime = new Date().toISOString();
export const handle = sequence(paraglideHandle, dbHandle, betterAuthHandle, handle2fa);

export const _checkDB = async (): Promise<boolean> => {
	let connected = false;

	try {
		await Promise.race([
			db.execute(sql`SELECT 1`),
			new Promise((_, reject) =>
				setTimeout(() => reject(new Error('query timeout')), 1_000)
			),
		]);
		connected = true;
	} catch (err) {
		console.log(err);
	}

	return connected;
};

export const init = async () => {
	if (!(await _checkDB())) {
		console.error('[ERROR]: DB Connection required to initialize app');
		process.exit(1);
	} else {
		console.log('[init] DB: Running migrations...');
		console.time('[init] Migrations...');
		try {
			execSync('bun run db:generate', { stdio: 'ignore' });
			execSync('bun run db:migrate', { stdio: 'ignore' });
		} catch {
			//
		}
		console.timeEnd('[init] Migrations...');
	}

	if (!fs.existsSync('config/custom.css')) {
		fs.writeFileSync(
			'config/custom.css',
			'/* Discover more at https://snapp.urania.dev/docs/styling */'
		);
	}

	const config = settings.get();
	const host = config.hosts[0]!;
	const auth = await getBetterAuth(host);

	for (const { email, username } of config.admin) {
		const password = generateRandomString(12);
		try {
			const exists = await db.query.user.findFirst({
				where: { OR: [{ email }, { username }] },
			});
			if (exists) continue;

			await auth.api.createUser({
				body: {
					data: { emailVerified: true, username },
					email,
					name: username,
					password,
					role: 'admin',
				},
			});
			console.log('[auth] generated admin %s \nPassword: %s', username, password);
		} catch (e) {
			if (CONSTANTS.DEBUG) console.error(e);
		}
	}

	const admin = await db.query.user.findMany({ where: { role: 'admin' } });

	await Promise.all(
		config.hosts.map(async (h) => {
			const slug = slugify(h.origin);
			let org = await db.query.organization.findFirst({ where: { id: slug } });

			if (!org) {
				[org] = await db
					.insert(organization)
					.values({
						createdAt: new Date(),
						id: slug,
						metadata: JSON.stringify({ origin: h.origin }),
						name: h.origin,
						slug,
					})
					.returning();
				console.log('[init] created organization %s', org?.name);
			}

			if (!org?.id) return;

			for (const a of admin) {
				const m = await db.query.member.findFirst({
					where: { organizationId: org.id, userId: a.id },
				});
				if (!m) {
					await db.insert(member).values({
						createdAt: new Date(),
						id: generateId(24),
						organizationId: org.id,
						role: 'owner',
						userId: a.id,
					});
					console.log('[init] added admin %s to organization %s', a.username, org.name);
				}
			}

			for (const [r, statements] of Object.entries(roles)) {
				const exists = await db.query.organizationRole.findFirst({
					where: { organizationId: org.id, role: r },
				});
				if (!exists) {
					await db.insert(organizationRole).values({
						id: generateId(24),
						organizationId: org.id,
						permission: JSON.stringify(statements.statements),
						role: r,
					});
				}
			}
		})
	);
};

export const handleError = ({ error }) => {
	console.log(error);
};
