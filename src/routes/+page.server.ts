import { redirect } from '@sveltejs/kit';
import { dev } from '$app/environment';
import { loadTranslations } from '$lib/i18n/server.js';
import { getSettings } from '$lib/server/config/index.js';
import * as shiki from 'shiki'
export const load = async (event) => {
	const settings = await getSettings();

	const disableHome = settings.get<boolean>('DISABLE_HOME') === true;
	if (disableHome) redirect(302, '/dashboard');
	const availableLanguages = settings.get<string>("AVAILABLE_LANGUAGES") as string

	return {
		availableLanguages,
		disableHome,
		dockerCompose: await dockerCompose(event.locals.theme),
		locale: event.locals.lang, 
				startDocker: await startDocker(event.locals.theme),
		translations: await loadTranslations(event.locals.lang||'en')
	};
};

export const actions = {
	language: async ({ cookies, request }) => {
		const form = await request.formData();
		const lang = form.get('language')?.toString();
		if (lang) {
			cookies.set('language', lang, {
				httpOnly: true,
				path: '/',
				secure: !dev || process.env.NODE_ENV !== 'development'

			});
			return { message: 'globals.saved' };
		}
	},
}

const startDocker = async (theme: string) =>
	await shiki.codeToHtml(
		`docker run uraniadev/snapp:latest`,
		{
			lang: 'bash',
			theme: (theme === 'system' || theme === 'dark' ? 'github-dark' : 'github-light')
		}
	);
const dockerCompose = async (theme: string) =>
	await shiki.codeToHtml(
		`services:
	snapp:
		image: uraniadev/snapp:latest
		ports:
			- 3000:3000
		environment:
			ORIGIN: example.org
			PUBLIC_URL: http://example.org
			DATABASE_PROVIDER: sqlite
			DATABASE_URL: file:./db.sqlite`,
		{
			lang: 'bash',
			theme: (theme === 'system' || theme === 'dark' ? 'github-dark' : 'github-light')
		}
	);
