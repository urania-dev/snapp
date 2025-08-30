import type { User } from "@prisma/client";
import type { StringValue } from "ms";

import { error, type RequestEvent } from "@sveltejs/kit";
import { enhance } from "@zenstackhq/runtime";
import { prisma } from "$lib/db/prisma";
import jwt from "jsonwebtoken";

import { getConfig } from "../config";

const config = getConfig();

export function createToken(payload: User, expiresIn?: StringValue): string {
	return jwt.sign(
		{
			...payload,
			sub: payload.id,
			userId: payload.id
		},
		config["TOKEN_SECRET"] as string,
		{ expiresIn: expiresIn ?? "7d" }
	);
}

export const getPrisma = async ({ locals, request }: RequestEvent) => {
	const token = request.headers.get("authorization")?.split("Bearer ")?.[1]?.toString();
	try {
		const user = jwt.verify(token || "Authentication token", config["TOKEN_SECRET"] as string) as {
			role: string;
			userId: string;
		};
		const exists = await prisma.token.findFirst({ where: { key: token, userId: user.userId } });

		if (!exists)
			throw error(401, {
				message: "This token is expired, please try renew or get a new one from the dashboard"
			});

		return enhance(prisma, {
			user: user && "userId" in user ? { id: user?.userId } : undefined
		});
	} catch (e) {
		if (locals.user) return enhance(prisma, { user: locals.user });
		throw error(403, {
			message:
				(e as { body?: { message?: string } })?.body?.message ??
				"This is a private service. Please provide correct credentials"
		});
	}
};
