import adapter from "@sveltejs/adapter-node";
import { vitePreprocess } from "@sveltejs/vite-plugin-svelte";

/** @type {import('@sveltejs/kit').Config} */
const config = {
	extensions: [".svelte"],

	kit: {
		adapter: adapter({
			out: "build",
			precompress: true
		}),
		csrf: {
			checkOrigin: false
		}
	},

	preprocess: [vitePreprocess()]
};

export default config;
