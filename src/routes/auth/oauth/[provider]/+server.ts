import { env } from "$env/dynamic/private";
import { type Action, error, redirect } from "@sveltejs/kit";
import {
  buildAuthorizationUrl,
  calculatePKCECodeChallenge,
  randomPKCECodeVerifier,
  randomState,
} from "openid-client";
import { getOIDCConfig } from "$lib/server/oauth/config";

export const GET: Action = async ({ cookies, params: { provider } }) => {
  const config = getOIDCConfig(provider!);

  if (!config) {
    throw error(400, "Provider not found");
  }

  const redirectUri = `${env.ORIGIN}/auth/oauth/${config.identity}/callback`;

  const codeVerifier = randomPKCECodeVerifier();
  const codeChallenge = await calculatePKCECodeChallenge(codeVerifier);
  const state = randomState();

  const authorizationUrl = buildAuthorizationUrl(config.configuration, {
    redirect_uri: redirectUri,
    code_challenge: codeChallenge,
    code_challenge_method: "S256",
    state,
    scope: config.rawConfig.scope,
  });

  cookies.set("oauth_state", state, {
    path: "/",
    secure: import.meta.env.PROD,
    httpOnly: true,
    maxAge: 60 * 10,
    sameSite: "lax",
  });
  cookies.set("oauth_code", codeVerifier, {
    path: "/",
    secure: import.meta.env.PROD,
    httpOnly: true,
    maxAge: 60 * 10,
    sameSite: "lax",
  });
  cookies.set("oauth_identity", config.identity, {
    path: "/",
    secure: import.meta.env.PROD,
    httpOnly: true,
    maxAge: 60 * 10,
    sameSite: "lax",
  });

  redirect(302, authorizationUrl);
};
