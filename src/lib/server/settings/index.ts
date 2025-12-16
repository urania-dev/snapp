// import lodash from 'lodash';
// import fs from 'node:fs';
// import yaml from 'yaml';

// import { CONSTANTS } from '../const';
// import { parseSettings, type TSettings } from './schema';

// const SETTINGS_PATH = 'config/settings.yaml';

// const FALLBACK_RAW = `appname: Snapp
// admin:
//   - email: admin@example.org
//     username: admin
// hosts:
//   - options:
//       customRedirect: /dashboard
//       disable:
//         homepage: false
//         twoFactor: true
//     origin: http://localhost:5173
// smtp:
//   enabled: false
// `;

// class Settings {
// 	#lastAccess: string | undefined = undefined;
// 	#settings: TSettings = {} as TSettings;

// 	constructor() {
// 		this.sync();
// 	}

// 	get() {
// 		this.sync();
// 		return this.#settings;
// 	}

// 	set(payload: unknown) {
// 		try {
// 			this.#settings = parseSettings(lodash.merge({}, this.#settings, payload));
// 			fs.mkdirSync('config', { recursive: true });
// 			fs.writeFileSync(SETTINGS_PATH, yaml.stringify(this.#settings));
// 			this.#lastAccess = new Date().toUTCString();
// 		} catch (error) {
// 			console.error('[settings]', 'Error while saving settings');
// 			if (CONSTANTS.DEBUG) console.error(error);
// 		}
// 	}

// 	sync = () => {
// 		try {
// 			if (!fs.existsSync(SETTINGS_PATH)) {
// 				fs.mkdirSync('config', { recursive: true });
// 				fs.writeFileSync(SETTINGS_PATH, FALLBACK_RAW);
// 			}

// 			const stats = fs.statSync(SETTINGS_PATH);
// 			if (this.#lastAccess && stats.mtime <= new Date(this.#lastAccess)) return;

// 			const raw = fs.readFileSync(SETTINGS_PATH, 'utf-8');
// 			const rawSettings = yaml.parse(raw);

// 			this.#settings = parseSettings(rawSettings);
// 			this.#lastAccess = new Date().toUTCString();

// 			if (CONSTANTS.DEBUG) console.info('[settings]', 'Updated from file');
// 		} catch (error) {
// 			console.error('[settings]', 'Error while loading settings');
// 			if (CONSTANTS.DEBUG) console.error('settings',error);
// 		}
// 	};
// }

// export const settings = new Settings();


import lodash from 'lodash';
 import fs from 'node:fs';
 import yaml from 'yaml';

 import { CONSTANTS } from '../const';
 import { parseSettings, type TSettings } from './schema';

 class Settings { #lastAccess: string | undefined = undefined;
	 #settings: TSettings = {} as TSettings;
 constructor() { this.sync();

 } get() { this.sync();
	 return this.#settings; } 
	 set(payload: unknown) 
	 { try { this.#settings = parseSettings(lodash.merge({}, this.#settings, payload));
	  fs.writeFileSync('config/settings.yaml', yaml.stringify(this.#settings));
	  this.#lastAccess = new Date().toUTCString();
	 } catch (error) { console.error('[settings]', 'Error while saving settings');
		 if (CONSTANTS.DEBUG) console.error(error);

	  } } sync = () => { try { const stats = fs.statSync('config/settings.yaml');
		 if (this.#lastAccess && stats.mtime <= new Date(this.#lastAccess)) return;
		 const raw = fs.readFileSync('config/settings.yaml').toString('utf-8');
		 const rawSettings = yaml.parse(raw);
		 this.#settings = parseSettings(rawSettings);
		 this.#lastAccess = new Date().toUTCString();
		 if (CONSTANTS.DEBUG) console.info('[settings]', 'Updated from file');

	  } catch (error) { console.error('[settings]', 'Error while loading settings');
		 if (CONSTANTS.DEBUG) console.error(error);

	  } }; } 
	  export const settings = new Settings();