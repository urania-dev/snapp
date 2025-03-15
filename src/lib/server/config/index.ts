import { prisma } from '../../db/prisma';
import { log } from '../log';
import 'dotenv/config'
const parseEnv = <T extends boolean | null | number | string | undefined>(
	value?: boolean | null | number | string | undefined
): T => {
	if (value == null || value === 'null') return null as T;

	const strValue = `${value}`.toLowerCase();

	switch (true) {
		case /^\d+$/.test(strValue):
			return parseInt(strValue, 10) as T;

		case strValue === 'true':
			return true as T;

		case strValue === 'false':
			return false as T;

		default:
			return value as T;
	}
};
const checkEnvVars = (...requiredVars: string[]): Record<string, boolean | number | string> => {
	const envs: Record<string, boolean | null | number | string> = {};
	const missingVars: string[] = [];

	requiredVars.forEach((variable) => {
		const rawValue = process.env[variable];
		if (rawValue) envs[variable] = parseEnv(rawValue);
		else missingVars.push(variable);
	});

	if (missingVars.length > 0) {
		missingVars.forEach((missing) => log.error(`ENV | Missing environment variable: [${missing}]`));
		process.exit(1);
	}
	return envs as Record<string, boolean | number | string>;
};

export const getConfig = () => {
	const requiredVars = [
		'HOST',
		'ORIGIN',
		'PORT',
		'DATABASE_PROVIDER',
		'TOKEN_SECRET',
		'ADMIN_USERNAME',
		'ADMIN_EMAIL',
		'ADMIN_PASSWORD',
		'ENABLE_SIGNUP',
		'ENABLED_MFA'
	];
	return checkEnvVars(...requiredVars);
};

export class ServerWideSettings {
	#settings: Record<string, boolean | null | number | string> = {};

	constructor(config: Record<string, boolean | number | string>) {
		this.initializeSettings(config);
	}

	get<T>(key: string): null | T {
		return parseEnv((this.#settings[key] as string) || undefined) as null | T;
	}

	list(): Record<string, boolean | null | number | string> {
		return Object.fromEntries(
			Object.entries(this.#settings).map(([key, value]) => [key, parseEnv(value)])
		);
	}

	set<T extends boolean | null | number | string>(key: string, value: T): void {
		this.#settings[key] = value;
	}

	async syncSettingsIfNeeded() {
		try {
			const lastSyncInMemory = this.get<string>('LAST_SYNC');
			const lastSyncInDB = await prisma.setting.findFirst({
				where: { field: 'LAST_SYNC' }
			});
			if (!lastSyncInDB || !lastSyncInMemory || lastSyncInDB.value > lastSyncInMemory) {
				if (process.env.LOG_LEVEL === 'debug') {
					log.info('Syncing settings from the database...');
				}

				const storedSettings = await prisma.setting.findMany({
					where: { userId: null }
				});

				storedSettings.forEach(({ field, value }) => this.set(field, value));
				this.set('LAST_SYNC', new Date().toISOString());
				if (process.env.LOG_LEVEL === 'debug') log.info('Syncing done.');
			}
		} catch (error) {
			if (process.env.LOG_LEVEL === 'debug') {
				log.error('Failed to sync with the database:', error);
			}
			this.set('DB_OFFLINE', true);
		}
	}

	async updateDB() {
		try {
			if (process.env.LOG_LEVEL === 'debug') {
				log.info('Updating LAST_SYNC in the database...');
			}
			await prisma.setting.upsert({
				create: {
					field: 'LAST_SYNC',
					id: 'LAST_SYNC',
					userId: null,
					value: new Date().toISOString()
				},
				update: { value: new Date().toISOString() },
				where: { id: 'LAST_SYNC' }
			});
			await this.syncSettingsIfNeeded();
		} catch (error) {
			log.error('Error updating the database:', error);
		}
	}

	private initializeSettings(config: Record<string, boolean | number | string>) {
		const envVars = {
			ALLOW_UNSECURE_HTTP: process.env.ALLOW_UNSECURE_HTTP || null,
			APPNAME: process.env.APPNAME || 'Snapp',
			DISABLE_HOME: process.env.DISABLE_HOME || null,
			ENABLE_LIMITS: process.env.ENABLE_LIMITS || null,
			MAX_SNAPPS_PER_USER: process.env.MAX_SNAPPS_PER_USER || 10,
			PUBLIC_UMAMI_WEBSITE_ID: process.env.PUBLIC_UMAMI_WEBSITE_ID || null,
			PUBLIC_UMAMI_WEBSITE_URL: process.env.PUBLIC_UMAMI_WEBSITE_URL || null,
			RPD_REQUESTS: process.env.RPD_REQUESTS || 144000,
			RPM_REQUESTS: process.env.RPM_REQUESTS || 100,
			SMTP_FROM: process.env.SMTP_FROM || null,
			SMTP_HOST: process.env.SMTP_HOST || null,
			SMTP_PASS: process.env.SMTP_PASS || null,
			SMTP_PORT: process.env.SMTP_PORT || null,
			SMTP_SSL: process.env.SMTP_SSL || false,
			SMTP_USER: process.env.SMTP_USER || null
		};

		Object.entries(envVars).forEach(([key, value]) => this.set(key, value));

		this.set('ENABLE_SIGNUP', `${config['ENABLE_SIGNUP'] || false}`);
		this.set('ENABLED_MFA', config['ENABLED_MFA'] || false);
		this.set('LAST_SYNC', null);

		this.syncSettingsIfNeeded().catch((error) => {
			if (process.env.LOG_LEVEL === 'debug') {
				log.error('Error syncing with DB:', error);
			}
		});
	}
}

const serverWideSettings = new ServerWideSettings(getConfig());

export const getSettings = async () => {
	if (serverWideSettings.get<boolean>('DB_OFFLINE') === false)
		await serverWideSettings.syncSettingsIfNeeded();
	return serverWideSettings;
};
