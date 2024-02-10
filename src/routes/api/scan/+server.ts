import { env } from '$env/dynamic/private';
import authenticate from '$lib/api/utils/authenticate.js';
import getLanguage from '$lib/api/utils/getLanguage.js';
import { db } from '$lib/db/index.js';
import { error, json, redirect } from '@sveltejs/kit';

async function cache_the_response_in_db(
	domain: string,
	{
		is_clean,
		positive,
		negative,
		response
	}: { is_clean: boolean; positive?: number; negative?: number; response: any }
) {
	await db.redis.hSet(`cache:vta:${domain}`, 'response', String(response));
	await db.redis.hSet(`cache:vta:${domain}`, 'is_clean', String(is_clean));
	await db.redis.hSet(`cache:vta:${domain}`, 'positive', String(positive));
	await db.redis.hSet(`cache:vta:${domain}`, 'negative', String(negative));
	await db.redis.expire(`cache:vta:${domain}`, 60 * 60 * 24);
}

async function get_cached_version(domain: string) {
	const clean = await db.redis.hGet(`cache:vta:${domain}`, 'is_clean');
	const response = await db.redis.hGet(`cache:vta:${domain}`, 'response');
	if (clean === 'true') return { is_clean: true, response };
	else false;
}

export async function POST({ request, locals, fetch }) {
	const EN = await getLanguage();
	try {
		const apiKey = await authenticate(request, EN);
		const session = await locals.getSession();
		if (!apiKey && !session) throw error(500, { message: EN['auth:not:authorized'] });
	} catch (error) {}

	const has_vt_key = await db.getSetting('settings:api:key:vt');

	if (!has_vt_key)
		return new Response(JSON.stringify({ is_clean: true, status: 200 }), {
			headers: {
				'Content-Type': 'application/json'
			}
		});

	const form = await request.formData();
	const url = form.get('url')?.toString().trim();
	if (!url)
		return new Response(JSON.stringify({ status: 400, message: 'snapp:original:url:unset' }));

	const cached = await get_cached_version(url.replaceAll(':', ''));
	if (cached) {
		return new Response(
			JSON.stringify({ is_clean: cached.is_clean, status: 200, response: cached.response ? JSON.parse(cached.response):null }),
			{
				headers: {
					'Content-Type': 'application/json',
					'cache-control': 'public, max-age=' + 60 * 60 * 24
				}
			}
		);
	}

	const formData = new FormData();
	formData.set('url', url);
	try {
		const analysis = await (
			await fetch(`https://www.virustotal.com/api/v3/urls`, {
				headers: {
					'x-apikey': env.VIRUSTOTAL_API_KEY
				},
				method: 'post',
				body: formData
			})
		).json();

		const analysis_id = analysis?.data?.links?.self;

		const response = await (
			await fetch(analysis_id, {
				headers: {
					'x-apikey': env.VIRUSTOTAL_API_KEY
				}
			})
		).json();
		const vote_for_malicious = response?.data?.attributes?.stats?.malicious;
		const vote_for_harmless = response?.data?.attributes?.stats?.harmless;

		const is_clean = vote_for_malicious > 0 ? vote_for_malicious < vote_for_harmless : true;

		cache_the_response_in_db(url.replaceAll(':', ''), {
			is_clean,
			positive: vote_for_harmless,
			negative: vote_for_malicious,
			response: JSON.stringify(response)
		});

		return new Response(JSON.stringify({ is_clean, status: 200 }), {
			headers: {
				'Content-Type': 'application/json',
				'cache-control': 'public, max-age=' + 60 * 60 * 24
			}
		});
	} catch (error) {
		return new Response(JSON.stringify({ status: 500, message: 'global:system:error' }), {
			headers: {
				'Content-Type': 'application/json'
			}
		});
	}
}
