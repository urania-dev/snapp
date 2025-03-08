import { redirect } from '@sveltejs/kit';
import { getSettings } from '$lib/server/config/index.js';
import * as shiki from 'shiki'
export const load = async (event) => {
	const settings = await getSettings();

	const disableHome = settings.get<boolean>('DISABLE_HOME') === true;
	if (disableHome) redirect(302, '/dashboard');

	return { disableHome, dockerCompose:await dockerCompose(event.locals.theme), startDocker:await startDocker(event.locals.theme) };
};

const startDocker =  async (theme: string) =>
	await shiki.codeToHtml(
		`docker run uraniadev/snapp:latest`,
		{
			lang: 'bash',
			theme: 'github-' + theme
		}
	);
const dockerCompose =  async (theme: string) =>
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
			theme: 'github-' + theme
		}
	);
