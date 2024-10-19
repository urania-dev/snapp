import { prisma } from '$lib/server/prisma';
import {
	ALLOW_UNSECURE_HTTP,
	ENABLE_LIMITS,
	MAX_SNAPPS_PER_USER,
	SNAPP_ORIGIN_URL_BLACKLISTED,
	SNAPP_ORIGIN_URL_REQUESTED,
	SNAPP_VIOLATES_APP_PATH,
	TAGS_AS_PREFIX
} from '$lib/utils/constants';
import { hash } from '@node-rs/argon2';
import { generateId } from 'lucia';
import { database } from '../database';
import type { Snapp } from '@prisma/client';
import { getServerSideSettings } from '$lib/server/server-wide-settings';

export const create_snapp = async (snapp: Partial<Snapp & { tags: string[] }>, userId: string, fetch: SvelteFetch) => {
	const is_admin = await database.users.is_admin(userId);
	if (!is_admin) {
		const api_limited = database.settings.parse(await database.settings.get(ENABLE_LIMITS), true);
		const getUserLimits = await database.settings
			.get(MAX_SNAPPS_PER_USER)
			.then((res) => (res && parseInt(res?.value)) || 0);
		const getUserSpecifiLimits = await database.settings
			.get(MAX_SNAPPS_PER_USER, userId)
			.then((res) => (res && parseInt(res?.value)) || 0);
		const max_snapps = Math.max(getUserLimits, getUserSpecifiLimits);
		const count = await prisma.snapp.count({ where: { userId } });
		if (api_limited && count >= max_snapps) return [null, MAX_SNAPPS_PER_USER] as [null, string];
	}

	let { original_url, hit, shortcode, created, notes, secret, expiration, max_usages, tags } = snapp;

	if (!original_url || typeof original_url !== 'string' || original_url.trim() === '')
		return [null, SNAPP_ORIGIN_URL_REQUESTED] as [null, string];
	const allow_http = database.settings.parse(
		await database.settings.get(ALLOW_UNSECURE_HTTP),
		true
	);
	if (!allow_http && !original_url.startsWith('https://'))
		return [null, ALLOW_UNSECURE_HTTP] as [null, string];
	const is_clean_and_whitelisted = await database.snapps.validate(original_url, fetch);
	if (!is_clean_and_whitelisted) return [null, SNAPP_ORIGIN_URL_BLACKLISTED] as [null, string];

	if (!shortcode) shortcode = generateId(5);
	if (['metrics', 'docs', 'auth', 'tags', 'users', 'settings', 'dashboard'].includes(shortcode)) return [null, SNAPP_VIOLATES_APP_PATH] as [null, string];

	const exists = await prisma.snapp.count({ where: { shortcode: { startsWith: shortcode } } });
	const password_hash = secret
		? await hash(secret, {
			// recommended minimum parameters
			memoryCost: 19456,
			timeCost: 2,
			outputLen: 32,
			parallelism: 1
		})
		: null;

	const settings = getServerSideSettings()
	const isActiveTagsAsPrefix = settings.get<boolean>(TAGS_AS_PREFIX)

	if (isActiveTagsAsPrefix === true && !tags?.length) return [null, TAGS_AS_PREFIX] as [null, string]

	const new_snapp = await prisma.snapp.create({
		data: {
			original_url,
			userId,
			shortcode: exists ? `${shortcode}-${exists}` : shortcode,
			notes,
			secret: password_hash,
			expiration,
			max_usages,
			created,
			hit,
			tags: {
				connectOrCreate: tags?.map(t => (
					{
						where: {
							slug: t,
						},
						create: {
							name: t,
							slug: t
						}
					}))
			}
		}
	});

	return [new_snapp, null] as [Snapp, null];
};
