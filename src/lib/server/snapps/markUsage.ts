import type { Snapp } from "@prisma/client";

import { type RequestEvent } from "@sveltejs/kit";
import { env } from "$env/dynamic/private";
import { prisma } from "$lib/db/prisma";
import { UAParser } from "ua-parser-js";

import { DEBUG, getSettings } from "../config";
import { log } from "../log";
import { watchLists } from "../watchlists";
import { getLocation } from "./getLocation";

export const markUsage = async (
	event: RequestEvent,
	snapp: Snapp
): Promise<[boolean, null | string | undefined]> => {
	let disabled = snapp.disabled;

	const headers = Object.fromEntries(event.request.headers);

	if (snapp.maxUsages > 0 && snapp.used >= snapp.maxUsages) {
		snapp.disabled = true;
		disabled = true;
	}

	const isBlacklisted = await watchLists.validateURL(snapp.originalUrl);
	for (const [label, err] of Object.entries(isBlacklisted.errors)) {
		if (DEBUG) log.info({ [label]: err });
		if (err) {
			snapp.disabled = true;
			await prisma.snapp.update({
				data: { ...snapp },
				where: { id: snapp.id }
			});
			return [false, err];
		}
	}
	if (disabled === true) {
		await prisma.snapp.update({
			data: { ...snapp },
			where: { id: snapp.id }
		});
		return [false, null];
	}
	const settings = await getSettings();

	const UPDATED = await prisma.snapp.update({
		data: {
			hit: { increment: 1 },
			used: { increment: 1 }
		},
		where: { id: snapp.id }
	});
	if (DEBUG) log.info(UPDATED);
	const language = headers["accept-language"]?.split(",")[0];
	const { "user-agent": userAgent, "x-forwarded-for": realIp } = headers;

	const parsedUA = new UAParser(userAgent).getResult();

	const browser = parsedUA.browser.name;
	const os = parsedUA.os.name;
	const device =
		(parsedUA.device.type &&
			`${parsedUA.device.type?.slice(0, 1).toUpperCase()} ${parsedUA.device.type
				?.slice(1)
				.toLowerCase()}`) ||
		("PC" as DeviceType);
	const cpu = parsedUA.cpu.architecture;

	let city: string | undefined, country: string | undefined, region: string | undefined;

	const { referrer } = event.request;

	const location = await getLocation(realIp);
	if (location) ({ city, country, region } = location);

	const umamiURL = settings.get<string>("PUBLIC_UMAMI_WEBSITE_URL");
	const umamiID = settings.get<string>("PUBLIC_UMAMI_WEBSITE_ID");
	if (!!umamiID && !!umamiURL) {
		const url = new URL(event.url);

		const utmParamsString = JSON.parse(snapp.utmParams || "[]") as string[];
		const utmParams = utmParamsString.map((p) => {
			const [key, value, name] = JSON.parse(p) as string[];
			return { key, name, value };
		});

		for (const params of utmParams) {
			url.searchParams.set(params.key, params.value);
		}
		const payload = {
			data: undefined as { [key: string]: string } | undefined,
			hostname: event.url.host,
			ip: realIp,
			language,
			name: undefined,
			referrer,
			screen: "--SSR",
			title: snapp.shortcode,
			url: url.pathname,
			userAgent,
			website: umamiID
		};

		try {
			const req = await event.fetch(umamiURL + "/api/send", {
				body: JSON.stringify({ payload, type: "event" }),
				headers: { "content-type": "application/json", "user-agent": userAgent },
				method: "POST"
			});
			if (env.LOG_LEVEL === "debug") log.info(await req.json());
		} catch (error) {
			if (env.LOG_LEVEL === "debug") log.error(error);
		}
	}
	const timestamp = new Date();
	await prisma.usage.create({
		data: {
			browser,
			city,
			country,
			cpu,
			device,
			language,
			os,
			ownerId: snapp.userId,
			referrer,
			region,
			snappId: snapp.id,
			timestamp,
			userAgent
		}
	});

	return [true, null];
};

export type DeviceType =
	| "console"
	| "embedded"
	| "mobile"
	| "PC"
	| "smarttv"
	| "tablet"
	| "wearable";
