import fs from 'node:fs';
import path from 'node:path';

import { CONSTANTS } from './const';
import { db } from './db';
export const cleanupOrphanFolders = async (basePath: string) => {
	if (CONSTANTS.DEBUG) console.log('cleaning user avatars folders');
	const existingUserIds = await db.query.user
		.findMany({ columns: { id: true } })
		.then((uu) => uu.map(({ id }) => id));
	if (!fs.existsSync(basePath)) return;
	const folders = fs.readdirSync(basePath);

	for (const folderName of folders) {
		const fullPath = path.join(basePath, folderName);

		if (!fs.statSync(fullPath).isDirectory()) continue;

		if (!existingUserIds.includes(folderName)) {
			if (CONSTANTS.DEBUG) console.log(`Removing orphaned avatar folder: ${folderName}`);
			fs.rmSync(fullPath, { force: true, recursive: true });
		}
	}
};

export const cleanupOrphanUserYaml = async (basePath: string) => {
	if (CONSTANTS.DEBUG) console.log('cleaning user yaml files');

	const existingUserIds = await db.query.user
		.findMany({ columns: { id: true } })
		.then((uu) => uu.map(({ id }) => id));

	if (!fs.existsSync(basePath)) return;

	const files = fs.readdirSync(basePath);

	for (const file of files) {
		const fullPath = path.join(basePath, file);

		if (!fs.statSync(fullPath).isFile()) continue;
		if (!file.endsWith('.yaml')) continue;

		const userId = file.replace('.yaml', '');

		if (!existingUserIds.includes(userId)) {
			if (CONSTANTS.DEBUG) console.log(`Removing orphaned user yaml: ${file}`);
			fs.rmSync(fullPath, { force: true });
		}
	}
};

export const cleanupOrphanOrganizationLogos = async (basePath: string) => {
	if (CONSTANTS.DEBUG) console.log('cleaning organization logos folders');

	const existingOrganizationIds = await db.query.organization
		.findMany({ columns: { id: true } })
		.then((oo) => oo.map(({ id }) => id));

	if (!fs.existsSync(basePath)) return;

	const folders = fs.readdirSync(basePath);

	for (const folderName of folders) {
		const orgPath = path.join(basePath, folderName);

		if (!fs.statSync(orgPath).isDirectory()) continue;

		if (!existingOrganizationIds.includes(folderName)) {
			if (CONSTANTS.DEBUG) console.log(`Removing orphaned organization folder: ${folderName}`);
			fs.rmSync(orgPath, { force: true, recursive: true });
			continue;
		}

		const imagesDir = path.join(orgPath, 'images');

		if (!fs.existsSync(imagesDir)) continue;

		const inner = fs.readdirSync(imagesDir);

		for (const file of inner) {
			const filePath = path.join(imagesDir, file);
			if (!fs.statSync(filePath).isFile()) continue;
		}
	}
};
