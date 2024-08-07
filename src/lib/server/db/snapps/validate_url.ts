import { extractDomain } from '$lib/server/extract-domain';
import { prisma } from '$lib/server/prisma';
import { SNAPP_NOT_FOUND, VIRUSTOTAL_API_KEY } from '$lib/utils/constants';
import { database } from '../database';

export const validate = async (url: string, fetch: SvelteFetch) => {
	const domain = extractDomain(url);
	if (!domain) return SNAPP_NOT_FOUND;
	const thirty_days_ago = new Date();
	thirty_days_ago.setMonth(thirty_days_ago.getMonth() - 1);

	const VT_APIKEY = await database.settings
		.get(VIRUSTOTAL_API_KEY)
		.then((res) => res?.value || null);

	if (VT_APIKEY) {
		await prisma.vtapicache.deleteMany({
			where: {
				domain,
				created: { lte: thirty_days_ago }
			}
		});

		const cached = await prisma.vtapicache.findFirst({ where: { domain } });

		const response = cached ? JSON.parse(cached.result) : await get_fresh(domain, fetch, VT_APIKEY);

		if (!cached)
			await prisma.vtapicache.upsert({
				where: { domain },
				update: {},
				create: {
					domain,
					result: JSON.stringify(response)
				}
			});

		const is_clean = response.malicious === 0 || response.malicious < response.harmless;
		const blacklisted = await database.watchlist.check(domain, null);
		return [is_clean, blacklisted].every((i) => i === true);
	} else return true;
};

async function get_fresh(domain: string, fetch: SvelteFetch, VT_APIKEY: string) {
	const encodedParams = new URLSearchParams();

	encodedParams.set('url', domain);
	const _url = 'https://www.virustotal.com/api/v3/urls';
	const _options = {
		method: 'POST',
		headers: {
			accept: 'application/json',
			'content-type': 'application/x-www-form-urlencoded',
			'x-apikey': VT_APIKEY
		},
		body: encodedParams
	};
	const res = await (await fetch(_url, _options)).json();

	const analysis = await (
		await fetch(res.data.links.self, {
			headers: {
				'x-apikey': VT_APIKEY
			}
		})
	).json();

	return analysis.data.attributes.stats;
}
