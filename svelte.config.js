import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';
import adapter from 'svelte-adapter-bun';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	extensions: ['.svelte'],

	kit: {
		adapter: adapter({
			out: 'build',
			precompress: true
		}),
		csrf: {
			checkOrigin: false
		},
		files: {
			lib: './src/lib/'
		}
	},

	preprocess: [vitePreprocess()]
};

export default config;
