import { oauth } from "$lib/server/auth.js";
import { redirect } from "@sveltejs/kit";
import { generateState, generateCodeVerifier } from "oslo/oauth2";

export const GET = async ({ cookies }) => {
    const state = generateState();
    const codeVerifier = generateCodeVerifier();

    const url = await oauth.createAuthorizationURL(
        state,
        codeVerifier,
        {
            scopes: ["email", "profile"],

        },
    );

    cookies.set("oauth_state", state, {
        path: "/",
        secure: import.meta.env.PROD,
        httpOnly: true,
        maxAge: 60 * 10,
        sameSite: "lax"
    });
    cookies.set("oauth_code", codeVerifier, {
        path: "/",
        secure: import.meta.env.PROD,
        httpOnly: true,
        maxAge: 60 * 10,
        sameSite: "lax"
    });

    redirect(302, url)
}