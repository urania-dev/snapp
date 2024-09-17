import adapter from '@sveltejs/adapter-node';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	preprocess: [vitePreprocess()],
	compilerOptions: { runes: true },
	kit: {
		adapter: adapter({
			precompress: true
		}),
		csrf: {
			checkOrigin: process.env.NODE_ENV !== 'development'
		},
		alias:{
			'$smtp':"./smtp.config.cjs"
		}
	},

	extensions: ['.svelte']
};

export default config;
