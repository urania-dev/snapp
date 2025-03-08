import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';
import { escapeSvelte, mdsvex } from 'mdsvex';
import { createHighlighter } from 'shiki';
import adapter from 'svelte-adapter-bun';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	extensions: ['.svelte', '.md', '.svx'],

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

	preprocess: [
		vitePreprocess(),
		mdsvex({
			extensions: ['.md'],
			highlight: {
				highlighter: async (code, lang = 'text') => {
					await highlighter.loadLanguage('javascript', 'typescript', 'prisma');
					const html = escapeSvelte(highlighter.codeToHtml(code, { lang, theme: 'poimandres' }));
					return `{@html \`${html}\` }`;
				}
			}
		})
	]
};
const highlighter = await createHighlighter({
	langs: ['javascript', 'typescript', 'prisma'],
	themes: ['poimandres']
});

export default config;
