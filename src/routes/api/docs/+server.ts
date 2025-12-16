import { ScalarApiReference } from '@scalar/sveltekit';
const render = ScalarApiReference({
	customCss: `
:root {
  --scalar-font: 'Outfit', system-ui, -apple-system, BlinkMacSystemFont,
  'Segoe UI', sans-serif;
  --scalar-font-code: 'Inconsolata', 'JetBrains Mono', ui-monospace,
  SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New',
  monospace;
	
  --nord-bg-1: #eceff4;
  --nord-bg-2: #e5e9f0;
  --nord-bg-3: #d8dee9;
  --nord-fg-1: #2e3440;
  --nord-fg-2: #4c566a;
  --nord-primary: #5e81ac;
  --nord-secondary: #88c0d0;
  --nord-accent: #8fbcbb;
  --nord-success: #a3be8c;
  --nord-warning: #ebcb8b;
  --nord-error: #bf616a;
  --nord-purple: #b48ead;
  --nord-orange: #d08770;

  --theme-color-1: var(--nord-fg-1);
  --theme-color-2: var(--nord-fg-2);
  --theme-color-3: var(--nord-secondary);
  --theme-color-accent: var(--nord-primary);

  --theme-background-1: var(--nord-bg-1);
  --theme-background-2: var(--nord-bg-2);
  --theme-background-3: var(--nord-bg-3);
  --theme-background-accent: color-mix(in srgb, var(--nord-accent) 25%, transparent);

  --theme-border-color: var(--nord-bg-3);
  --theme-button-1: var(--nord-primary);
  --theme-button-1-hover: var(--nord-secondary);
  --theme-button-1-color: var(--nord-bg-1);

  --theme-color-green: var(--nord-success);
  --theme-color-red: var(--nord-error);
  --theme-color-yellow: var(--nord-warning);
  --theme-color-blue: var(--nord-secondary);
  --theme-color-orange: var(--nord-orange);
  --theme-color-purple: var(--nord-purple);

  --theme-scrollbar-color: rgba(46, 52, 64, 0.25);
  --theme-scrollbar-color-active: rgba(46, 52, 64, 0.45);

  --theme-font: 'Outfit', system-ui, sans-serif;
  --theme-font-code: 'Inconsolata', monospace;
  
}
.light-mode {
  --scalar-color-1: var(--theme-color-1);
  --scalar-color-2: var(--theme-color-2);
  --scalar-color-3: var(--theme-color-3);
  --scalar-color-accent: var(--theme-color-accent);

  --scalar-background-1: var(--theme-background-1);
  --scalar-background-2: var(--theme-background-2);
  --scalar-background-3: var(--theme-background-3);
  --scalar-background-accent: var(--theme-background-accent);
  --scalar-border-color: var(--theme-border-color);

  --scalar-scrollbar-color: var(--theme-scrollbar-color);
  --scalar-scrollbar-color-active: var(--theme-scrollbar-color-active);
 
}

.dark-mode {
  --nord-dark-bg-1: #1a1c1f;
  --nord-dark-bg-2: #1e2127;
  --nord-dark-bg-3: #242830;
  --nord-dark-fg-1: #eceff4;
  --nord-dark-fg-2: #d8dee9;
  --nord-dark-primary: #d08770;
  --nord-dark-accent: #b48ead;

  --theme-color-1: var(--nord-dark-fg-1);
  --theme-color-2: var(--nord-dark-fg-2);
  --theme-color-3: #81a1c1;
  --theme-color-accent: var(--nord-dark-primary);

  --theme-background-1: var(--nord-dark-bg-1);
  --theme-background-2: var(--nord-dark-bg-2);
  --theme-background-3: var(--nord-dark-bg-3);
  --theme-background-accent: color-mix(in srgb, var(--nord-dark-accent) 25%, transparent);

  --theme-border-color: #3b4252;
  --theme-button-1: var(--nord-dark-primary);
  --theme-button-1-hover: var(--nord-orange);
  --theme-button-1-color: var(--nord-dark-bg-1);

  --theme-scrollbar-color: rgba(216, 222, 233, 0.25);
  --theme-scrollbar-color-active: rgba(216, 222, 233, 0.55);

  --scalar-color-1: var(--theme-color-1);
  --scalar-color-2: var(--theme-color-2);
  --scalar-color-3: var(--theme-color-3);
  --scalar-color-accent: var(--theme-color-accent);

  --scalar-background-1: var(--theme-background-1);
  --scalar-background-2: var(--theme-background-2);
  --scalar-background-3: var(--theme-background-3);
  --scalar-background-accent: var(--theme-background-accent);
  --scalar-border-color: var(--theme-border-color);
 
  }
.scalar-app .bg-sidebar-b-1{
	--scalar-sidebar-background-1: var(--scalar-background-2)
}
.scalar-card .bg-b-2{
  --scalar-background-2:var(--theme-background-2);
}

.open-api-client-button{
	border-bottom: 1px solid var(--scalar-border-color);
	margin-bottom:.25rem
}

body{overflow-x:clip}


`,
	defaultHttpClient: {
		clientKey: 'fetch',
		targetKey: 'node'
	},
  expandAllModelSections:false,
	layout: 'modern',
	operationsSorter:"method",
  sources: [
		{
			title: 'Snapp',
			url: '/api/openapi.json'
		},
		{
			title: 'Better-Auth',
			url: '/api/auth/open-api/generate-schema'
		}
	],
	tagsSorter: (a: { name: string }, b: { name: string }): number => {
		const order = [
			/^URLS/i, // exact URL / URLS
			/^URL/i, // exact URL / URLS
			/^Tag/i, // anything starting with "Tag"
			/^Health/i // anything starting with "Tag"
		];

		const findIndex = (name: string) => {
			for (let i = 0; i < order.length; i++) {
				if (order[i].test(name)) return i;
			}
			return Infinity; // not matched
		};

		const idxA = findIndex(a.name);
		const idxB = findIndex(b.name);

		if (idxA !== idxB) return idxA - idxB;

		return a.name.localeCompare(b.name);
	},
	theme: 'fastify'
});

export const GET = () => render();