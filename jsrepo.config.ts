import { defineConfig } from 'jsrepo';

export default defineConfig({
	// configure were stuff goes here
	paths: {
		action: '$lib/actions',
		block: '$lib/components',
		hook: '$lib/hooks',
		lib: '$lib',
		ui: '$lib/components/blocks',
		util: '$lib/'
	},
	// configure where stuff comes from here
	registries: ['@ieedan/shadcn-svelte-extras']
});
