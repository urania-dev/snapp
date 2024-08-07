import { database } from '$lib/server/db/database';
import { VIRUSTOTAL_API_KEY, VIRUSTOTAL_API_STATUS } from '$lib/utils/constants';
import { json } from '@sveltejs/kit';

export const GET = async ({ fetch, url }) => {
	const weekAgo = new Date();
	weekAgo.setDate(weekAgo.getDate() - 7);

	const status_response = await database.settings.expirable(VIRUSTOTAL_API_STATUS, weekAgo);
	const vtapikeystatus = database.settings.parse(status_response, true);
	const expiration = (status_response && new Date(status_response.created)) || null;
	if (expiration) expiration.setDate(expiration.getDate() + 7) && expiration.setHours(0, 0, 0, 0);
	if (vtapikeystatus === true)
		return json(
			{ active: true, cached: true, expire: expiration },
			{
				headers: {
					'Cache-Control':
						'max-age=' + Math.floor(Math.abs(new Date().getTime() - expiration!.getTime()) / 1000)
				}
			}
		);

	const vtapikey = await database.settings.get(VIRUSTOTAL_API_KEY).then((res) => res?.value);

	if (!vtapikey) return json({ active: false, error: 'API KEY NOT FOUND' });

	const response = await fetch('https://www.virustotal.com/api/v3/domains/virustotal.com', {
		headers: {
			'x-apikey': vtapikey
		}
	});

	const status = response.status;
	const { data, error } = await response.json();
	if (status !== 200 || error) return json({ active: false, error });

	await database.settings.set(VIRUSTOTAL_API_STATUS, 'true');

	return json({ active: true, report: data });
};
