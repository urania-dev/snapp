import { type RequestEvent } from '@sveltejs/kit';
import { Umami } from '@umami/node';
import { m } from '$lib/paraglide/messages';
import { CONSTANTS } from '$lib/server/const';
import { db } from '$lib/server/db';
import { metric } from '$lib/server/db/schema';
import * as schema from '$lib/server/db/schema';
import { getLocation } from '$lib/server/maxmind';
import { slugify } from '$lib/utils';
import { generateId } from 'better-auth';
import { eq } from 'drizzle-orm/sql';
import { UAParser } from 'ua-parser-js';

import { getHost } from '../remotes/config.remote';

const getUmami = async (event: RequestEvent) => {
	const userAgent = event.request.headers.get('user-agent')?.toString();
	const host = await getHost();
	if (!host.thirdparty?.umami?.url || !host.thirdparty?.umami?.url)
		return {
			event,
			host,
			umami: null,
			userAgent
		};
	const umami = new Umami({
		hostUrl: host.thirdparty?.umami?.url,
		userAgent,
		websiteId: host.thirdparty?.umami?.websiteId
	});

	return { event, host, umami, userAgent };
};

export const logNotFound = async (event: RequestEvent) => {
	const { host, umami } = await getUmami(event);
	if (!umami || !host.thirdparty?.umami) return;
	const url = new URL(event.url);
	const language = event.request.headers.get('accept-language')?.toString()?.split(',')[0];

	const payload = {
		data: undefined as { [key: string]: string } | undefined,
		hostname: url.hostname,
		language,
		name: `⚠️ ${m.url()} | ${m.errors_not_found()}`,
		referrer: event.request.referrer,
		screen: '--SSR',
		title: `/${event.params.shortcode}`,
		url,
		website: host.thirdparty.umami.websiteId
	};
	try {
		await umami.track(payload);
	} catch (err) {
		if (CONSTANTS.DEBUG) console.error('umami alert - not found: %s', event.params.shortcode, err);
	}
};

export const logSecretNotValid = async (event: RequestEvent) => {
	const { host, umami } = await getUmami(event);
	if (!umami || !host.thirdparty?.umami) return;
	const url = new URL(event.url);
	const language = event.request.headers.get('accept-language')?.toString()?.split(',')[0];

	const payload = {
		data: undefined as { [key: string]: string } | undefined,
		hostname: url.hostname,
		language,
		name: `⚠️ ${m.url()} | ${m.errors_password_invalid()}`,
		referrer: event.request.referrer,
		screen: '--SSR',
		title: `/${event.params.shortcode}`,
		url,
		website: host.thirdparty.umami.websiteId
	};
	try {
		await umami.track(payload);
	} catch (err) {
		if (CONSTANTS.DEBUG) console.error('umami alert - not found: %s', event.params.shortcode, err);
	}
};

export const logDBUnavailable = async (event: RequestEvent) => {
	const { host, umami } = await getUmami(event);
	if (!umami || !host.thirdparty?.umami) return;
	const url = new URL(event.url);
	const language = event.request.headers.get('accept-language')?.toString()?.split(',')[0];

	const payload = {
		data: undefined as { [key: string]: string } | undefined,
		hostname: url.hostname,
		language,
		name: `⚠️ DB | ${m.errors_not_found()}`,
		referrer: event.request.referrer,
		screen: '--SSR',
		title: `/${event.params.shortcode}`,
		url,
		website: host.thirdparty.umami.websiteId
	};
	try {
		await umami.track(payload);
	} catch (err) {
		if (CONSTANTS.DEBUG) console.error('umami alert - not found: %s', event.params.shortcode, err);
	}
};

export const logInvalidLoginAttempt = async (event: RequestEvent) => {
	const { host, umami } = await getUmami(event);
	if (!umami || !host.thirdparty?.umami) return;
	const url = new URL(event.url);
	const language = event.request.headers.get('accept-language')?.toString()?.split(',')[0];

	const payload = {
		data: undefined as { [key: string]: string } | undefined,
		hostname: url.hostname,
		language,
		name: `⚠️ ${m.users()} | ${m.errors_wrong_credentials()}`,
		referrer: event.request.referrer,
		screen: '--SSR',
		title: `/${event.params.shortcode}`,
		url,
		website: host.thirdparty.umami.websiteId
	};
	try {
		await umami.track(payload);
	} catch (err) {
		if (CONSTANTS.DEBUG) console.error('umami alert - not found: %s', event.params.shortcode, err);
	}
};
export const logVisit = async (event: RequestEvent, shortened:typeof schema.url.$inferSelect) => {
	const { host, umami, userAgent } = await getUmami(event);
	if (!event?.params.shortcode) return;
	const url = new URL(event.url);
	const language = event.request.headers.get('accept-language')?.toString()?.split(',')[0];

	const parsedUA = new UAParser(userAgent).getResult();

	const browser = parsedUA.browser.name;
	const os = parsedUA.os.name;
	const cpu = parsedUA.cpu.architecture;
	const device =
		(parsedUA.device.type &&
			`${parsedUA.device.type?.slice(0, 1).toUpperCase()}${parsedUA.device.type
				?.slice(1)
				.toLowerCase()}`) ||
		('PC' as DeviceType);

	let city: string | undefined, country: string | undefined, region: string | undefined;
	const realIp = event.request.headers.get('x-forwarded-for')?.toString();
	const location = await getLocation(realIp);
	if (location) ({ city, country, region } = location);
	try {
		if (!event.params.shortcode) return;
		
		for (const params of Object.values(shortened.utm || {})) {
			url.searchParams.append(params.key, params.value);
		}
		const payload = {
			data: undefined as { [key: string]: string } | undefined,
			hostname: url.hostname,
			language,
			referrer: event.request.referrer,
			screen: '--SSR',
			title: `/${event.params.shortcode}`,
			url: url.href,
			website: host.thirdparty?.umami?.websiteId
		};
		await umami?.track(payload);
		await db.insert(metric).values({
			browser,
			city,
			country,
			cpu,
			device,
			id: generateId(24),
			language,
			organizationId:slugify(host.origin),
			os,
			ownerId: shortened.userId,
			referrer: event.request.referrer,
			region,
			timestamp: new Date(),
			urlId: shortened.id,
			userAgent,
			utm: shortened.utm ?? {}
		});
		if (shortened.limit > -1 && shortened.limit === shortened.hit+1) shortened.active = false;
		await db.update(schema.url).set({
			...shortened,
			hit: shortened.hit + 1
		}).where(eq(schema.url.id, shortened.id));
	} catch (err) {
		if (CONSTANTS.DEBUG) console.error('umami alert - not found: %s', event.params.shortcode, err);
	}
};

export type DeviceType =
	| 'console'
	| 'embedded'
	| 'mobile'
	| 'PC'
	| 'smarttv'
	| 'tablet'
	| 'wearable';
