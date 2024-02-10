import { db } from '$lib/db/index.js';
import { EntityId } from 'redis-om';

import { error, fail, redirect } from '@sveltejs/kit';
import UAParser from 'ua-parser-js';
import maxmind, { type CityResponse, type CountryResponse } from 'maxmind';
import bcrypt from 'bcrypt';

import { extractDomain } from '$lib/db/snapps/shorten.js';
import { randomUUID } from 'crypto';

let lookup = await maxmind.open('src/lib/server/geo-db/geolite-2-city.mmdb');

async function markUsage(snapp: DBSnapp, request: Request, url: URL, eventData: any = null) {
	const headers = Object.fromEntries(request.headers);
	
	if (Number(snapp.used) > Number(snapp.max_usages)) {
		snapp.disabled = true;
	} else {
		snapp.used = Number(snapp.used ?? 0) + 1;
	}

	await db.snapps.save(snapp.id, snapp);
	if (snapp.disabled) throw error(404, { message: 'snapp:is:disabled' });

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

	const umamiURL = await db.getSetting('settings:api:key:umami:url');
	const websiteID = await db.getSetting('settings:api:key:umami:website:id');

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

	let id = randomUUID();
	let timestamp = new Date();

	await db.usages.save(id, {
		id,
		timestamp,
		snapp_id: snapp.id,
		snapp_user_id: snapp.user_id,
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
	});
}

export async function load({ request, params: { shortcode }, fetch, url, parent }) {
	if (!shortcode)
		throw error(404, {
			message: 'snapps:not:found'
		});
	const redirection = await db.snapps.search().where('shortcode').equals(shortcode).first();

	if (!redirection || !redirection[EntityId]) throw error(404, { message: 'snapps:not:found' });

	if (redirection !== null) {
		const is_banned = await db.blacklisted({
			domain: extractDomain((redirection as DBSnapp).original_url) as string
		});

		if (is_banned)
			throw error(401, {
				message: 'snapps:domain:blacklisted'
			});

		const { has_secret } = redirection;
		const data = await parent();
		const { localization, locales, languages } = (await (
			await fetch('/api/localization?lang=' + data.lang, {
				method: 'GET'
			})
		).json()) as {
			localization: Record<string, string>;
			locales: string[];
			languages: { label: string; code: string }[];
		};
		if (has_secret === false) {
			await markUsage(redirection as DBSnapp, request, url);
			throw redirect(302, (redirection as DBSnapp).original_url);
		} else return { has_secret: true, localization, shortcode };
	} else
		throw error(404, {
			message: 'snapps:not:found'
		});
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
	async default({ request, params: { shortcode }, fetch, url }) {
		const form = await request.formData();
		let today = new Date();
		today.setHours(0, 0, 0, 0);
		const secret = form.get('secret') as string | null;
		if (secret) {
			const snapp = await db.snapps.search().where('shortcode').equals(shortcode).first();

			if (snapp === null)
				return fail(404, {
					message: `snapps:not:found`,
					short_code: null,
					success: false
				});

			const validSecret = await bcrypt.compare(secret, (snapp as DBSnapp).secret as string);
			if (validSecret) {
				await markUsage(snapp as DBSnapp, request, url, {
					short_code: snapp.short_code,
					message: 'Attempt secret'
				});
				throw redirect(302, (snapp as DBSnapp).original_url);
			} else {
				await markUsage(snapp as DBSnapp, request, url, {
					short_code: snapp.short_code,
					message: 'Attempt secret'
				});
				return fail(401, { message: 'snapps:secret:invalid', short_code: null, success: false });
			}
		} else return fail(400, { message: 'snapps:secret:unset', short_code: null, success: false });
	}
};
