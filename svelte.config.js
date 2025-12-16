import adapter from '@sveltejs/adapter-node';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	compilerOptions: { experimental: { async: true } },
	// Consult https://svelte.dev/docs/kit/integrations
	// for more information about preprocessors
	kit: { adapter: adapter(), experimental: { remoteFunctions: true } },
	preprocess: vitePreprocess()
};

export default config;
