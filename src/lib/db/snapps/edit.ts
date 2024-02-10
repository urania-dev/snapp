import bcrypt from 'bcrypt';
import { type Database } from '..';
import SnappError from '../utils/snappError';
import { env } from '$env/dynamic/private';
import { extractDomain } from './shorten';
import { generateRandomString } from '$lib/utils/randomString';

export default async function edit(
	this: Database,
	{ id, original_url, shortcode, secret, user_id, max_usages, notes }: Partial<DBSnapp>,
	fetch: (input: string | URL | Request, init?: RequestInit | undefined) => Promise<Response>,
	expiration?: number
) {
	if (!id) return new SnappError(404, { message: 'snapps:not:found' });

	let snapp = await this.snapps.search().where('id').equals(id).first();

	if (!user_id) return new SnappError(404, { message: 'auth:user:not:found' });
	if (!snapp) return new SnappError(404, { message: 'snapps:not:found' });
	const user = (await this.users.search().where('id').equal(user_id).first()) as DBUser;

	if (!user) return new SnappError(404, { message: 'auth:not:authorized' });

	const regex = new RegExp(/^https:\/\/[^\s/$.?#].[^\s]*$/);

	if (!original_url || typeof original_url !== 'string' || original_url.trim() === '')
		return new SnappError(400, { message: 'snapps:original:url:unset' });

	if (original_url) {
		if (regex.test(original_url) === false)
			return new SnappError(400, { message: 'snapps:original:url:invalid' });
		snapp.original_url = original_url;
	}

	const domain = extractDomain(original_url);
	if (!domain) return new SnappError(400, { message: 'snapps:original:url:invalid' });
	const is_blacklisted = await this.blacklisted({ domain });
	if (is_blacklisted) return new SnappError(400, { message: 'snapps:domain:blacklisted' });

	const has_vt_key = await this.getSetting('settings:api:key:vt');

	const vtFormData = new FormData();
	vtFormData.set('url', original_url);
	if (has_vt_key !== undefined) {
		const res = await (
			await fetch('/api/scan', {
				method: 'post',
				body: vtFormData
			})
		).json();

		if (res.status !== 200) return new SnappError(500, { ...(res as object) });

		const is_malicious = res.is_clean === false || false;
		if (is_malicious)
			return new SnappError(401, {
				original_url: true,
				message: 'snapps:vt:api:key:malicious'
			});
	}

	if (notes) snapp.notes = notes;
	if (max_usages) snapp.max_usages = max_usages;

	try {
		if (secret) {
			snapp.has_secret = true;
			snapp.secret = secret;
		} else snapp.has_secret = false;
	} catch (error) {
		return new SnappError(400, { ...(error as object) });
	}

	try {
		const banned_shortcodes = ['api', 'dashboard', 'auth'];
		if (!shortcode || banned_shortcodes.includes(shortcode))
			snapp.shortcode = generateRandomString(5);
		else {
			const exists = await this.snapps
				.search()
				.where('shortcode')
				.equals(`${shortcode}*`)
				.and('id')
				.not.equal(snapp.id as string)
				.count();
			if (exists) snapp.shortcode = `${shortcode}-${exists}`;
			else snapp.shortcode = shortcode;
		}
	} catch (error) {
		return new SnappError(500, { ...(error as object) });
	}

	if (expiration) snapp.expiration = new Date(new Date().getTime() + expiration);
	const newSnapp = (await this.snapps.save(snapp.id as string, snapp).then((snapp) => {
		delete snapp.secret;
		return snapp;
	})) as DBSnapp;

	if (expiration !== undefined) {
		const validDate = isNaN(new Date(expiration).getTime());
		if (validDate) return new SnappError(400, { message: 'snapps:date:invalid' });
		await this.snapps.expire(newSnapp.id, expiration);
	} else this.redis.persist('snapps:' + newSnapp.id);

	return {
		success: true,
		status: 200,
		snapp: { ...newSnapp },
		expires: expiration
			? new Date(new Date().getTime() + expiration * 1000).toLocaleDateString(env.DEFAULT_LANG)
			: undefined
	};
}
