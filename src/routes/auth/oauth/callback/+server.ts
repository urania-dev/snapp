// routes/login/oauth/callback/+server.ts
import { OAuth2RequestError } from "arctic";
import { generateIdFromEntropySize } from "lucia";
import { oauth, lucia } from "$lib/server/auth";

import { error, redirect, type RequestEvent } from "@sveltejs/kit";
import { prisma } from "$lib/server/prisma";
import { env } from "$env/dynamic/private";
import { database } from "$lib/server/db/database";
import { ENABLED_SIGNUP } from "$lib/utils/constants";

export async function GET(event: RequestEvent): Promise<Response> {
    const code = event.url.searchParams.get("code");
    const state = event.url.searchParams.get("state");
    const storedState = event.cookies.get("oauth_state") ?? null;
    const codeVerifier = event.cookies.get("oauth_code") ?? null;
    if (!code || !state || !storedState || state !== storedState || !codeVerifier) {
        throw error(400, "STATE and STORE STATE not matching OR missing code verifier")
    }
    const enabled_signup = database.settings.parse(await database.settings.get(ENABLED_SIGNUP), true);

    try {
        const tokens = await oauth.validateAuthorizationCode(code, codeVerifier);

        const oauthUserResponse = await fetch(env.KC_USERINFO_URL, {
            headers: {
                Authorization: `Bearer ${tokens.accessToken}`
            }
        });
        const oauthUser = await oauthUserResponse.json();

        // Replace this with your own DB client.
        const existingUser = await prisma.user.findFirst({ where: { email: oauthUser.email } })

        if (existingUser) {
            const session = await lucia.createSession(existingUser.id, { two_factor_verified: true });
            const sessionCookie = lucia.createSessionCookie(session.id);
            event.cookies.set(sessionCookie.name, sessionCookie.value, {
                path: ".",
                ...sessionCookie.attributes
            });
        } else {
            if (!enabled_signup) throw error(401, { message: 'SIGNUP DISABLED' })
            const userId = generateIdFromEntropySize(10); // 16 characters long

            await prisma.user.create({
                data: {
                    id: userId,
                    username: oauthUser.email,
                    email: oauthUser.email as string,
                    password_hash: 'none'
                }
            })

            const session = await lucia.createSession(userId, {
                two_factor_verified: true
            });
            const sessionCookie = lucia.createSessionCookie(session.id);
            event.cookies.set(sessionCookie.name, sessionCookie.value, {
                path: ".",
                ...sessionCookie.attributes
            });
        }
    } catch (e) {
        // the specific error message depends on the provider
        if (e instanceof OAuth2RequestError) {
            // invalid code
            console.log(e)
            throw error(400, e.message)
        }
        console.log(e)
        throw error(500)
    }

    event.cookies.delete('oauth_code', {
        path: "/",
        secure: import.meta.env.PROD,
        httpOnly: true,
        maxAge: 60 * 10,
        sameSite: "strict"
    })
    event.cookies.delete('oauth_state', {
        path: "/",
        secure: import.meta.env.PROD,
        httpOnly: true,
        maxAge: 60 * 10,
        sameSite: "strict"
    })
    redirect(302, '/dashboard')
}