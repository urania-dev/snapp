import lodash from 'lodash';
import fs from 'node:fs';
import yaml from 'yaml';

import { CONSTANTS } from '../const';
import { db } from '../db';
import { cleanupOrphanUserYaml } from '../utils';
import { parsePreferences, type TPreferences } from './schema';
class Preferences {
	#lastAccess: string | undefined = undefined;
	#preferences: Map<string, TPreferences> = new Map<string, TPreferences>([]);
	constructor() {
		this.initData();
	}
	get(userId: string) {
		this.sync(userId);
		const pref = this.#preferences.get(userId);
		return parsePreferences(pref);
	}
	initData = async () => {
		const users = await db.query.user.findMany({ columns: { id: true } });
		users.map(({ id }) => this.sync(id));
	};
	set(payload: unknown, userId: string) {
		try {
			this.#preferences.set(
				userId,
				parsePreferences(lodash.merge({}, this.#preferences.get(userId) || {}, payload))
			);
			fs.writeFileSync(`config/users/${userId}.yaml`, yaml.stringify(this.#preferences));
			this.#lastAccess = new Date().toUTCString();
		} catch (error) {
			console.error('[preferences]', 'Error while saving preferences');
			if (CONSTANTS.DEBUG) console.error(error);
		}
	}
	sync = (userId: string) => {
		try {
			const exists = fs.existsSync(`config/users/${userId}.yaml`);
			if (!exists) return;
			const stats = fs.statSync(`config/users/${userId}.yaml`);
			if (this.#lastAccess && stats.mtime <= new Date(this.#lastAccess)) return;
			const raw = fs.readFileSync(`config/users/${userId}.yaml`).toString('utf-8');
			const rawpreferences = yaml.parse(raw);
			this.#preferences.set(userId, parsePreferences(rawpreferences));
			this.#lastAccess = new Date().toUTCString();
			console.info('[preferences]', 'Updated from file %s', userId);
			cleanupOrphanUserYaml('config/users')
		} catch (error) {
			console.error('[preferences]', 'Error while loading preferences');
			console.error(error);
		}
	};
}
export const preferences = new Preferences();
