import { prisma } from '$lib/server/prisma.js';
import type { Snapp } from '@prisma/client';
import { error, fail, redirect } from '@sveltejs/kit';
import UAParser from 'ua-parser-js';
import maxmind, { type CityResponse, type CountryResponse } from 'maxmind';
import bcrypt from 'bcrypt';

let lookup = await maxmind.open('src/lib/server/geo-db/geolite-2-city.mmdb');

async function markUsage(snapp: Snapp, request: Request) {
	const headers = Object.fromEntries(request.headers);

	const language = headers['accept-language'].split(',')[0];
	const { 'user-agent': user_agent, 'x-real-ip': real_ip } = headers;

	const uaParsed = new UAParser(user_agent);

	const parsed = uaParsed.getResult();

	const browser = parsed.browser.name;
	const os = parsed.os.name;
	const device = parsed.device.type && `${parsed.device.type?.slice(0,1).toUpperCase()}${parsed.device.type?.slice(1).toLowerCase()}` || 'PC';
	const cpu = parsed.cpu.architecture;
	let city: undefined | string, country: string | undefined, region: string | undefined;

	const { referrer } = request;

	const location = await getLocation(real_ip);
	if (location) ({ city, country, region } = location);

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

export async function load({ request, params: { short_code } }) {
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
			await markUsage(redirection, request);
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
	async default({ request, params: { short_code } }) {
		const form = await request.formData();
		let today = new Date();
		today.setHours(0, 0, 0, 0);
		const secret = form.get('secret') as string | null;
		if (secret) {
			const snapp = await prisma.snapp.findFirst({
				where: {
					short_code,
					expires_at: { gt: today }
				}
			});
			if (snapp === null) return fail(404, { message: `[${short_code}] Not found` });

			const validSecret = await bcrypt.compare(secret, snapp.secret!);

			if (validSecret) {
				await markUsage(snapp, request);
				throw redirect(302, snapp.original_url);
			}
		}
	}
};
