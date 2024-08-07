import { SNAPP_DISABLED, UMAMI_URL, UMAMI_WEBSITE_ID } from '$lib/utils/constants';
import type { Snapp } from '@prisma/client';
import { database } from '../db/database';
import UAParser from 'ua-parser-js';
import { getLocation } from '../get-location';
import { generateId } from 'lucia';
import { prisma } from '../prisma';

async function markUsage(
	snapp: Snapp,
	request: Request,
	url: URL,
	eventData: any = null,
	fetch: SvelteFetch
) {
	const headers = Object.fromEntries(request.headers);
	if (snapp.max_usages > 0 && snapp.used >= snapp.max_usages) {
		snapp.disabled = true;
	} else {
		snapp.used = Number(snapp.used ?? 0) + 1;
	}

	if (snapp.disabled) return SNAPP_DISABLED;
	await prisma.snapp.update({
		where: { id: snapp.id },
		data: { disabled: snapp.disabled, used: snapp.used, hit: { increment: 1 } }
	});

	const language = headers['accept-language']?.split(',')[0];

	const { 'user-agent': user_agent, 'x-forwarded-for': real_ip } = headers;
	const uaParsed = new UAParser(user_agent);

	const parsed = uaParsed.getResult();

	type DeviceType = 'console' | 'mobile' | 'tablet' | 'smarttv' | 'wearable' | 'embedded' | 'PC';
	const browser = parsed.browser.name;
	const os = parsed.os.name;
	const device = ((parsed.device.type &&
		`${parsed.device.type?.slice(0, 1).toUpperCase()}${parsed.device.type
			?.slice(1)
			.toLowerCase()}`) ||
		'PC') as DeviceType;
	const cpu = parsed.cpu.architecture;
	let city: undefined | string, country: string | undefined, region: string | undefined;

	const { referrer } = request;

	const location = await getLocation(real_ip);
	if (location) ({ city, country, region } = location);

	const umamiURL = await database.settings.get(UMAMI_URL);
	const websiteID = await database.settings.get(UMAMI_WEBSITE_ID);

	if (umamiURL && websiteID) {
		let data = {
			payload: {
				hostname: url.hostname,
				language: language,
				referrer: referrer,
				screen: '--SSR',
				title: `/${snapp.shortcode}`,
				url: url.pathname,
				website: websiteID,
				name: undefined as string | undefined,
				data: undefined as { [key: string]: string } | undefined
			},
			type: 'event'
		};

		if (eventData !== null) {
			data = {
				...data,
				payload: {
					...data.payload,
					name: 'Invalid secret on /' + snapp.shortcode,
					data: eventData
				}
			};
		}

		await fetch(`${umamiURL}/api/send`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'user-agent': user_agent,
				'x-forwarded-for': real_ip
			},
			body: JSON.stringify(data)
		});
	}

	let id = generateId(8);
	let timestamp = new Date();

	await prisma.usages.create({
		data: {
			id,
			timestamp,
			snappId: snapp.id,
			snappUserId: snapp.userId,
			language,
			user_agent,
			referrer,
			device,
			country,
			region,
			city,
			os,
			browser,
			cpu
		}
	});
}

export { markUsage };
