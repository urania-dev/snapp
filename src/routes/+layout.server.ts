import { env } from "$env/dynamic/private";
import { database } from "$lib/server/db/database";
import { DISABLE_HOME } from "$lib/utils/constants";

export async function load({ locals: { lang, session, theme, user }, url }) {
  const is_authenticated = session !== null;
  const is_admin = is_authenticated &&
    (await database.users.is_admin(session.userId));
  const _lang = user
    ? (await database.settings.get("language", user?.id))?.value || lang
    : lang;
  const _theme = user
    ? (await database.settings.get("theme", user?.id))?.value ||
      env.DEFAULT_THEME || theme
    : env.DEFAULT_THEME || theme;
  const home_disabled = database.settings.parse(
    await database.settings.get(DISABLE_HOME),
    true,
  );
  return {
    theme: _theme,
    lang: _lang,
    pathname: url.pathname,
    origin: env.origin || url.origin,
    is_authenticated,
    home_disabled,
    is_admin,
  };
}
