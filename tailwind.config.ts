import type { Config } from 'tailwindcss';

export default {
	content: ['./src/**/*.{html,js,svelte,ts}'],
	darkMode: 'selector',
	theme: {
		fontFamily: {
			sans: ['Roboto']
		},
		extend: {
			fontSize: {
				xxs: '0.625rem'
			}
		}
	},

	plugins: []
} as Config;
