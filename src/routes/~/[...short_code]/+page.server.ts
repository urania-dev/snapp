import { prisma } from '$lib/server/prisma.js';
import type { Snapp } from '@prisma/client';
import { error, fail, redirect } from '@sveltejs/kit';
import UAParser from 'ua-parser-js';
import maxmind, { type CityResponse, type CountryResponse } from 'maxmind';
import bcrypt from 'bcrypt';

let lookup = await maxmind.open('src/lib/server/geo-db/geolite-2-city.mmdb');

async function markUsage(snapp: Snapp, request: Request, url: URL, eventData: any = null) {
	const headers = Object.fromEntries(request.headers);

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

	const umamiURL = process.env.UMAMI_URL;
	const websiteID = process.env.WEBSITE_ID;

	if (umamiURL && websiteID) {
		let data = {
			payload: {
				hostname: url.hostname,
				language: language,
				referrer: referrer,
				screen: '--SSR',
				title: `/~/${snapp.short_code}`,
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
					name: 'Invalid secret on /~/' + snapp.short_code,
					data: eventData
				}
			};
		}

		const res = await fetch(`${umamiURL}/api/send`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'user-agent': user_agent,
				'x-forwarded-for': real_ip
			},
			body: JSON.stringify(data)
		});

	}

	await prisma.urlUsage.create({
		data: {
			timestamp: new Date(),
			snapp_id: snapp.id,
			language,
			user_agent,
			referrer,
			device,
			country,
			city,
			region,
			os,
			browser,
			cpu
		}
	});
}

export async function load({ request, params: { short_code }, fetch, url }) {
	if (!short_code) throw error(404, { message: 'Not found' });

	let today = new Date();
	today.setHours(0, 0, 0, 0);
	const redirection = await prisma.snapp.findFirst({
		where: {
			short_code,
			OR: [
				{
					expires_at: { gt: today }
				},
				{
					expires_at: null
				}
			]
		}
	});

	if (redirection !== null) {
		const { has_secret } = redirection;
		if (has_secret === false) {
			await markUsage(redirection, request, url);
			throw redirect(302, redirection.original_url);
		} else return { has_secret: true };
	} else throw error(404, { message: `[${short_code}] Not found` });
}

async function getLocation(ip: string) {
	if (!lookup) lookup = await maxmind.open('src/lib/server/geo-db/geolite-2-city.mmdb');
	if (!ip || ip.trim() === '') return;
	const data = lookup.get(ip);
	if (data === null) return null;
	const city = (data as CityResponse).city?.names.en;
	const region = (data as CityResponse).subdivisions?.map((subdiv) => subdiv.names.en).join(' / ');
	const country = (data as CountryResponse).country?.names.en;
	return { city, region, country };
}

export const actions = {
	async default({ request, params: { short_code }, fetch, url }) {
		const form = await request.formData();
		let today = new Date();
		today.setHours(0, 0, 0, 0);
		const secret = form.get('secret') as string | null;
		if (secret) {
			const snapp = await prisma.snapp.findFirst({
				where: {
					short_code,
					OR: [
						{
							expires_at: { gt: today }
						},
						{
							expires_at: null
						}
					]
				}
			});

			if (snapp === null)
				return fail(404, {
					message: `[${short_code}] Not found`,
					short_code: null,
					success: false
				});

			const validSecret = await bcrypt.compare(secret, snapp.secret!);
			if (validSecret) {
				await markUsage(snapp, request, url, {
					short_code: snapp.short_code,
					message: 'Attempted login failed'
				});
				throw redirect(302, snapp.original_url);
			} else
				await markUsage(snapp, request, url, {
					short_code: snapp.short_code,
					message: 'Attempted login failed'
				});
			return fail(401, { message: 'Secret is incorrect', short_code: null, success: false });
		} else return fail(400, { message: 'Secret is not set', short_code: null, success: false });
	}
};
