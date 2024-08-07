import { database } from '$lib/server/db/database.js';
import { DISABLE_HOME } from '$lib/utils/constants.js';
import { redirect } from '@sveltejs/kit';
import * as shiki from 'shiki';

export async function load({ locals: { theme }, request }) {
	const is_disabled = database.settings.parse(await database.settings.get(DISABLE_HOME), true);
	if (is_disabled) redirect(302, '/dashboard');

	return {
		code: await code(theme)
	};
}

const code = async (theme: string) =>
	await shiki.codeToHtml(
		`services:
  snapp:
    image: uraniadev/snapp:0.8
    ports: 
      - 3000:3000
    environment:
      TOKEN_SECRET: # openssl rand -base64 32
      ORIGIN: https://example.com
	  
`,
    	{
			lang: 'yaml',
			theme: 'github-dark'
		}
	);
