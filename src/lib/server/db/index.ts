import { env } from '$env/dynamic/private';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

import * as schema from './schema';
import { relations } from './schema';
if (!env.DATABASE_URL) throw new Error('DATABASE_URL is not set');
const client = postgres(env.DATABASE_URL);
const db = drizzle({
	client,
	relations,
	schema,
});

export {db}