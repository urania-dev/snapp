import type { PrismaClient, User } from '@prisma/client';

import { error, json } from '@sveltejs/kit';
import { log } from '$lib/server/log';
import { existsSync, writeFileSync } from 'fs';
import { stat } from 'fs/promises';
import papa from 'papaparse';
import path from 'path';

export const GET = async ({ locals: { prisma, user }, params: { id } }) => {
	if (!user || (user.id !== id && user.role === 'user')) {
		throw error(401, { message: 'errors.unauthorized' });
	}

	const csvDir = path.resolve('output');
	const csvPath = path.join(csvDir, `${id}.csv`);
	const tenMinutesAgo = Date.now() - 10 * 60 * 1000; // Current time - 10 minutes

	if (!existsSync(csvPath)) {
		if (process.env.LOG_LEVEL === 'debug') log.info('CSV does not exist. Creating a new one...');
		await createCSV(user, id, prisma, csvPath);
		return json({ available: false });
	}

	try {
		const fileStat = await stat(csvPath);
		if (process.env.LOG_LEVEL === 'debug')
			log.info('File modification time: ' + new Date(fileStat.mtimeMs));
		if (process.env.LOG_LEVEL === 'debug') log.info('Threshold time: ' + new Date(tenMinutesAgo));

		if (fileStat.mtimeMs < tenMinutesAgo) {
			if (process.env.LOG_LEVEL === 'debug')
				log.info('CSV is older than 10 minutes. Rebuilding...');
			await createCSV(user, id, prisma, csvPath);
			return json({ available: false });
		}

		if (process.env.LOG_LEVEL === 'debug') log.info('CSV is fresh. No need to rebuild.');
		return json({ available: true });
	} catch (err) {
		if (process.env.LOG_LEVEL === 'debug') log.info({ err, message: 'Error checking file stats:' });
		return json({ available: false });
	}
};

const createCSV = async (user: User, userId: string, prisma: PrismaClient, csvPath: string) => {
	const isAdmin = user.role !== 'user';
	if (!userId) return;

	const snapps = await prisma.snapp.findMany({ where: { userId: isAdmin ? undefined : userId } });
	const csv = papa.unparse(snapps, { header: true });

	writeFileSync(csvPath, csv, { encoding: 'utf-8' });

	if (existsSync(csvPath)) log.info({ csvPath, message: 'Created Export' });
};
