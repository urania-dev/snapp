import { env } from "$env/dynamic/public";
import { database } from "$lib/server/db/database.js";
import {
  DISABLE_HOME,
  UMAMI_URL,
  UMAMI_WEBSITE_ID,
} from "$lib/utils/constants.js";
import { redirect } from "@sveltejs/kit";
import * as shiki from "shiki";

export async function load({ locals: { theme }, }) {
  const is_disabled = database.settings.parse(
    await database.settings.get(DISABLE_HOME),
    true,
  );
  if (is_disabled) redirect(302, "/dashboard");

  const umami_website_id = (await database.settings.get(UMAMI_WEBSITE_ID))
    ?.value;
  const umami_url = (await database.settings.get(UMAMI_URL))?.value;

  return {
    code: await code(theme),
    UMAMI_WEBSITE_ID: umami_website_id || env.PUBLIC_UMAMI_WEBSITE_ID,
    UMAMI_WEBSITE_URL: umami_url || env.PUBLIC_UMAMI_WEBSITE_URL,
  };
}

const code = async (theme: string) =>
  await shiki.codeToHtml(
    `services:
  snapp:
    image: uraniadev/snapp:latest
    ports: 
      - 3000:3000
    environment:
      TOKEN_SECRET: # openssl rand -base64 32
      ORIGIN: https://example.com
	  
`,
    {
      lang: "yaml",
      theme: `github-${theme}`,
    },
  );
