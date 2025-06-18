import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig, searchForWorkspaceRoot } from 'vite';

import { getConfig } from './src/lib/server/config';

const config = getConfig();

export default defineConfig({
	optimizeDeps: {
		include: ['@amcharts/amcharts5']
	},
	plugins: [sveltekit()],
	server: {
		allowedHosts: true,
		fs: {
			allow: [searchForWorkspaceRoot(process.cwd()), './maxmind', './output']
		},
		origin: config.ORIGIN as string,
		port: config.PORT as number,
	}
});
