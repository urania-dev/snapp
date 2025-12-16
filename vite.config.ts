import { paraglideVitePlugin } from '@inlang/paraglide-js';
import { sveltekit } from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';
export default defineConfig({
	plugins: [
		tailwindcss({
			optimize: {
				minify: true
			}
		}),
		sveltekit(),
		paraglideVitePlugin({
			outdir: './src/lib/paraglide',
			project: './project.inlang'
		})
	],
	server: { allowedHosts: true }
});
