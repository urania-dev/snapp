export { default as AdminPanel } from './component.svelte';

export const checkVTApiKey = async (f: typeof fetch, key?: null | string) => {
	if (!key || key?.trim() === '') return false;
	const weekAgo = new Date();
	weekAgo.setDate(weekAgo.getDate() - 7);

	const domain = 'https://www.virustotal.com/api/v3/domains/virustotal.com';
	const encodedParams = new URLSearchParams();
	encodedParams.set('url', domain);
	const _url = 'https://www.virustotal.com/api/v3/urls';
	const _options = {
		body: encodedParams,
		headers: {
			accept: 'application/json',
			'content-type': 'application/x-www-form-urlencoded',
			'x-apikey': key
		},
		method: 'POST'
	};
	const res = await (await f(_url, { ..._options })).json();
	if (!res?.data?.links) return false;

	try {
		const analysis = await (
			await f(res.data.links.self, {
				headers: {
					'x-apikey': key
				}
			})
		).json();

		if (typeof analysis === 'object') {
			return true;
		} else return false;
	} catch (error) {
		console.error(error);
	}
	return false;
};
