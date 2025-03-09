import type { Snapp } from '@prisma/client';

import { type RequestEvent } from '@sveltejs/kit';
import { prisma } from '$lib/db/prisma';
import { UAParser } from 'ua-parser-js';

import { getSettings } from '../config';
import { log } from '../log';
import { watchLists } from '../watchlists';
import { getLocation } from './getLocation';

export const markUsage = async (
	event: RequestEvent,
	snapp: Snapp
): Promise<[boolean, null | string | undefined]> => {
	let disabled = false;

	const headers = Object.fromEntries(event.request.headers);

	if (snapp.maxUsages > 0 && snapp.used >= snapp.maxUsages) {
		snapp.disabled = true;
		disabled = true;
	}

	const isBlacklisted = await watchLists.validateURL(snapp.originalUrl);
	for (const [label, err] of Object.entries(isBlacklisted.errors)) {
		if(process.env.LOG_LEVEL==='debug')log.info({ [label]: err });
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
	if (process.env.LOG_LEVEL === 'debug') log.info(UPDATED);
	const language = headers['accept-language']?.split(',')[0];
	const { 'user-agent': userAgent, 'x-forwarded-for': realIp } = headers;

	const parsedUA = new UAParser(userAgent).getResult();

	const browser = parsedUA.browser.name;
	const os = parsedUA.os.name;
	const device =
		(parsedUA.device.type &&
			`${parsedUA.device.type?.slice(0, 1).toUpperCase()} ${parsedUA.device.type
				?.slice(1)
				.toLowerCase()}`) ||
		('PC' as DeviceType);
	const cpu = parsedUA.cpu.architecture;

	let city: string | undefined, country: string | undefined, region: string | undefined;

	const { referrer } = event.request;

	const location = await getLocation(realIp);
	if (location) ({ city, country, region } = location);

	const umamiURL = settings.get('PUBLIC_UMAMI_WEBSITE_URL');
	const umamiID = settings.get('PUBLIC_UMAMI_WEBSITE_ID');

	if (umamiID && umamiURL) {
		const data = {
			payload: {
				data: undefined as { [key: string]: string } | undefined,
				hostname: event.url.hostname,
				language,
				name: undefined as string | undefined,
				referrer,
				screen: '--SSR',
				title: `/${snapp.shortcode}`,
				url: event.url.pathname,
				website: umamiID
			},
			type: 'event'
		};
		const sendPayloadToUmami = async (d: typeof data) => {
			try {
				await event.fetch(`${umamiURL}/api/send`, {
					body: JSON.stringify(d),
					headers: {
						'Content-Type': 'application/json',
						'user-agent': userAgent,
						'x-forwarded-for': realIp
					},
					method: 'POST'
				});
			} catch (error) {
				if (process.env.LOG_LEVEL === 'debug') log.error(error);
			}
		};
		sendPayloadToUmami(data);
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
	| 'console'
	| 'embedded'
	| 'mobile'
	| 'PC'
	| 'smarttv'
	| 'tablet'
	| 'wearable';
