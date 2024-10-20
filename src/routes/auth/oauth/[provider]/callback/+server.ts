// routes/login/oauth/callback/+server.ts
import { generateIdFromEntropySize } from "lucia";
import { lucia } from "$lib/server/auth";

import { error, redirect } from "@sveltejs/kit";
import { prisma } from "$lib/server/prisma";
import { database } from "$lib/server/db/database";
import { ENABLED_SIGNUP } from "$lib/utils/constants";
import { getOIDCConfig } from '$lib/server/oauth/config';
import { authorizationCodeGrant, fetchUserInfo } from 'openid-client';
import { env } from '$env/dynamic/private';

export const GET = async ({ cookies, url, params: { provider } }) => {
    const cookieProviderIdentity = cookies.get("oauth_identity") ?? null;
    const storedState = cookies.get("oauth_state") ?? null;
    const codeVerifier = cookies.get("oauth_code") ?? null;

    if (!storedState || !codeVerifier)
        throw error(400, "STATE and STORE STATE not matching OR missing code verifier")


    if (!cookieProviderIdentity || cookieProviderIdentity !== provider)
        throw error(400, "Provider not found in cookie")


    const config = getOIDCConfig(provider!);
    if (!config)
        throw error(400, "Provider not found")


    const enabled_signup = database.settings.parse(await database.settings.get(ENABLED_SIGNUP), true);

    url.protocol = new URL(env.ORIGIN).protocol; // fix for reverse proxy
    try {
        const tokens = await authorizationCodeGrant(config.configuration, url, {
            expectedState: storedState,
            pkceCodeVerifier: codeVerifier,
            idTokenExpected: true,
        }, undefined);

        const claims = tokens.claims();

        if (!claims) {
            throw error(400, "Missing claims")
        }

        const oauthUser = await fetchUserInfo(config.configuration, tokens.access_token, claims.sub);

        const email = oauthUser[config.rawConfig.emailField];

        if (!email || typeof email !== 'string') {
            throw error(400, "Missing email")
        }

        // Replace this with your own DB client.
        const existingUser = await prisma.user.findFirst({ where: { email } })

        if (existingUser) {
            const session = await lucia.createSession(existingUser.id, { two_factor_verified: true });
            const sessionCookie = lucia.createSessionCookie(session.id);
            cookies.set(sessionCookie.name, sessionCookie.value, {
                path: ".",
                ...sessionCookie.attributes
            });
        } else {
            if (!enabled_signup) throw error(401, { message: 'SIGNUP DISABLED' })
            const userId = generateIdFromEntropySize(10); // 16 characters long

            await prisma.user.create({
                data: {
                    id: userId,
                    username: email,
                    email,
                    password_hash: 'none'
                }
            })

            const session = await lucia.createSession(userId, {
                two_factor_verified: true
            });
            const sessionCookie = lucia.createSessionCookie(session.id);
            cookies.set(sessionCookie.name, sessionCookie.value, {
                path: ".",
                ...sessionCookie.attributes
            });
        }
    } catch (err) {
        console.error(err);
        error(500)
    }

    cookies.delete('oauth_code', {
        path: "/",
        secure: import.meta.env.PROD,
        httpOnly: true,
        maxAge: 60 * 10,
        sameSite: "strict"
    })
    cookies.delete('oauth_state', {
        path: "/",
        secure: import.meta.env.PROD,
        httpOnly: true,
        maxAge: 60 * 10,
        sameSite: "strict"
    })
    cookies.delete('oauth_identity', {
        path: "/",
        secure: import.meta.env.PROD,
        httpOnly: true,
        maxAge: 60 * 10,
        sameSite: "strict"
    })
    redirect(302, '/dashboard')
}