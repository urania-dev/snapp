import type { Session, User } from "@prisma/client";
import type { RequestEvent } from "@sveltejs/kit";

import { sha256 } from "@oslojs/crypto/sha2";
import { encodeBase32LowerCaseNoPadding, encodeHexLowerCase } from "@oslojs/encoding";
import { enhance } from "@zenstackhq/runtime";
import { dev } from "$app/environment";
import { prisma } from "$lib/db/prisma";

import { getSettings } from "../config";

export type SessionValidationResult =
	| { session: null; user: null }
	| { session: Session; user: User };

export async function createPasswordResetToken(userId: string) {
	await prisma.passwordReset.deleteMany({ where: { userId } });
	const tokenId = generateSessionToken();
	const expiresAt = new Date(new Date().getTime() + 1000 * 60 * 60);

	const localDB = enhance(prisma, { user: { id: userId } });
	const { tokenHash } = await localDB.passwordReset.create({
		data: {
			expiresAt,
			tokenHash: tokenId,
			userId
		}
	});
	return { tokenHash };
}

export async function createSession(token: string, userId: string, tfs = false): Promise<Session> {
	const sessionId = encodeHexLowerCase(sha256(new TextEncoder().encode(token)));
	const session: Session = {
		expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30),
		id: sessionId,
		tfs,
		userId
	};
	await prisma.session.create({
		data: session
	});
	return session;
}

export function deleteSessionTokenCookie(event: RequestEvent): void {
	event.cookies.delete("auth", {
		expires: new Date(),
		httpOnly: true,
		path: "/",
		sameSite: "lax",
		secure: !dev
	});
}

export function generateSessionToken(): string {
	const bytes = new Uint8Array(20);
	crypto.getRandomValues(bytes);
	const token = encodeBase32LowerCaseNoPadding(bytes);
	return token;
}

export async function invalidateSession(sessionId: string): Promise<void> {
	await prisma.session.delete({ where: { id: sessionId } });
}

export async function invalidateSessions(userId: string): Promise<void> {
	await prisma.session.deleteMany({ where: { userId } });
}

export function setSessionTokenCookie(event: RequestEvent, token: string, expiresAt: Date): void {
	event.cookies.set("auth", token, {
		expires: expiresAt,
		httpOnly: true,
		path: "/",
		sameSite: "lax",
		secure: process.env.NODE_ENV !== "development"
	});
}

export async function validateSessionToken(token: string): Promise<SessionValidationResult> {
	const settings = await getSettings();
	const DATABASE_OFFLINE = settings.get<boolean>("DB_OFFLINE") === true;
	if (DATABASE_OFFLINE) {
		return {
			session: null,
			user: null
		};
	}
	const sessionId = encodeHexLowerCase(sha256(new TextEncoder().encode(token)));
	const result = await prisma.session.findUnique({
		include: {
			user: true
		},
		where: {
			id: sessionId
		}
	});

	if (result === null) {
		return { session: null, user: null };
	}

	const { user, ...session } = result;

	if (Date.now() >= session.expiresAt.getTime()) {
		await prisma.session.delete({ where: { id: sessionId } });
		return { session: null, user: null };
	}

	if (Date.now() >= session.expiresAt.getTime() - 1000 * 60 * 60 * 24 * 15) {
		session.expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30);
		await prisma.session.update({
			data: {
				expiresAt: session.expiresAt
			},
			where: {
				id: session.id
			}
		});
	}
	return { session, user };
}
