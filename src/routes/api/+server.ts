import { json } from '@sveltejs/kit';
import { defineEndpoint } from '@uraniadev/sveltekit-valibot-openapi';
import { m } from '$lib/paraglide/messages';
import { db } from '$lib/server/db';
import { sql } from 'drizzle-orm';
import {
	literal,
	number,
	object,
	string,
	union
} from 'valibot';

import type { RequestHandler } from './$types';

const dependencyStatusSchema = object({
	error: string(),
	responseTimeMs: number(),
	status: union([literal('up'), literal('down'), literal('degraded')])
});

const healthCheckSchema = object({
	checks: object({
		cache: dependencyStatusSchema,
		database: dependencyStatusSchema
	}),
	environment: string(),
	status: union([literal('ok'), literal('degraded'), literal('error')]),
	timestamp: string(),
	uptimeSeconds: number(),
	version: string()
});
export const _openapi = {
	GET: defineEndpoint({
		description: m.api_health_check(),
		method: 'GET',
		responses: {
			200: {
				description: m.api_health_check_healthy(),
				schema: healthCheckSchema
			},
			503: {
				description: m.api_health_check_unhealthy(),
				schema: healthCheckSchema
			}
		},
		summary: m.api_health_check_helper(),
		tags:['Health']
	})
} as const;

type DependencyStatus = {
	error: string;
	responseTimeMs: number;
	status: DependencyStatusName;
};

type DependencyStatusName = 'degraded' | 'down' | 'up';


async function checkDatabase(): Promise<DependencyStatus> {
	const started = Date.now();

	try {
		await db.execute(sql`SELECT 1`);

		return {
			error: '',
			responseTimeMs: Date.now() - started,
			status: 'up'
		};
	} catch (err) {
		return {
			error: err instanceof Error ? err.message : m.api_health_error_db_unknown(),
			responseTimeMs: Date.now() - started,
			status: 'down'
		};
	}
}

export const GET: RequestHandler = async () => {
	const database = await checkDatabase()

	let overallStatus: 'degraded' | 'error' | 'ok' = 'ok';

	if (database.status === 'down') {
		overallStatus = 'error';
	} else if (database.status === 'degraded') {
		overallStatus = 'degraded';
	}

	const httpStatus = overallStatus === 'error' ? 503 : 200;

	const body = {
		checks: {  database },
		environment: process.env.NODE_ENV ?? m.api_health_env_unknown(),
		status: overallStatus,
		timestamp: new Date().toISOString(),
		uptimeSeconds: process.uptime(),
		version: process.env.npm_package_version ?? m.api_health_version_unknown()
	};

	return json(body, { status: httpStatus });
};
