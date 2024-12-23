import { redirect } from "@sveltejs/kit";
import { renderSVG } from "uqr";
import { database } from "$lib/server/db/database.js";
import { getServerSideSettings } from "$lib/server/server-wide-settings";
import { ENABLED_MFA } from "$lib/utils/constants.js";
export const load = async ({ locals: { session, user } }) => {
  if (!user || !session) redirect(302, "/auth/sign-in");
  const settings = getServerSideSettings();
  if (settings.get(ENABLED_MFA) !== true) redirect(302, "/dashboard");
  if (user.setupTwoFactor) redirect(302, "/auth/mfa");
  const keyURI = await database.users.update_two_factor_secret(
    user.id,
    user.username,
  );
  const qrcode = renderSVG(keyURI);
  return { qrcode };
};
