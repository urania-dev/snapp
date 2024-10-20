import { database } from '$lib/server/db/database.js';
import { prisma } from '$lib/server/prisma';
import { getServerSideSettings } from '$lib/server/server-wide-settings/index.js';
import { ALLOW_UNSECURE_HTTP, MAX_SNAPPS_PER_USER, SNAPP_ORIGIN_URL_BLACKLISTED, SNAPP_ORIGIN_URL_REQUESTED, TAGS_AS_PREFIX, UNAUTHORIZED } from '$lib/utils/constants.js';
import { fail, redirect } from '@sveltejs/kit';

export const load = async ({ locals: { session, user }, request, params: { id }, url }) => {
	if (!session || !user) redirect(302, '/auth/sign-in');
	if (!id) redirect(302, '/dashboard');

	const settings = getServerSideSettings()
	const TAP = settings.get(TAGS_AS_PREFIX)

	const startString = url.searchParams.get('start')?.toString() || undefined;
	const endString = url.searchParams.get('end')?.toString() || undefined;
	const [snapp, err] = await database.snapps.id(id);

	if (!snapp) redirect(302, '/dashboard');

	const base = new Date()
	let start = startString ? new Date(startString) : new Date(base)
	let end = endString ? new Date(endString) : new Date(base)

	if (!startString || !endString) start.setTime(end.getTime() - 7 * 24 * 60 * 60 * 1000);
	if (start === end) start.setTime(end.getTime() - 7 * 24 * 60 * 60 * 1000);

	if (!snapp || err) redirect(302, '/dashboard');

	const metrics = await getTimelineValue(snapp.id, start, end);
	const totalVisits = await prisma.usages.count({ where: { snappId: snapp.id } });

	const customLimit = await database.settings
		.get('TAGS_IN_SNAPP_ROWS', user.id)
		.then((res) => (res?.value && parseInt(res.value)) || -1);

	const limit =
		customLimit !== -1 ? customLimit : parseInt(url.searchParams.get('limit')?.toString() || '4');
	const page = parseInt(url.searchParams.get('page')?.toString() || '1');
	const offset = (page - 1) * limit;

	const query = url.searchParams.get('query')?.toString();

	const [tags, countTag] = await database.tags.get(user.id, query, 5, offset, { name: 'asc' })
	const tagsInSnapp = await prisma.tag.findMany({ where: { snapps: { some: { id: snapp.id } } } })
	return { snapp, metrics, start, end, totalVisits, origin: url.origin, tags, countTag, page, offset, query, limit, tagsInSnapp, tagsAsPrefix: TAP };
};

export const actions = {
	"handle-tag": async ({ locals: { session, user }, request, params: { id }, fetch }) => {
		const settings = getServerSideSettings()
		if (!session) redirect(302, '/');
		const form = await request.formData();
		const tagId = form.get('id')?.toString() || null
		const tagAction = form.get('action')?.toString() || null
		if (!tagId) return fail(400, { message: "errors.generic" })
		if (tagAction === "connect") {
			await prisma.tag.update({ where: { id: tagId }, data: { snapps: { connect: { id } } } })
		}
		if (tagAction === "disconnect") await prisma.tag.update({ where: { id: tagId }, data: { snapps: { disconnect: { id } } } })

		return { message: "settings.saved" }
	},
	'save-rows': async ({ locals: { session, user }, request }) => {
		if (!session || !user) redirect(302, '/');
		const form = await request.formData();

		const rows = form.get('rows')?.toString();
		if (rows) await database.settings.set('TAGS_IN_SNAPP_ROWS', rows, user.id);
	},
	disable: async ({ locals: { session, user }, request, params: { id }, fetch }) => {
		if (!session) redirect(302, '/');

		const form = await request.formData();
		const disabled = form.get('disabled')?.toString()?.toLowerCase() === 'true' || false;
		const [snapp, err] = await database.snapps.id(id);

		if (!snapp || err) {
			let message = 'errors.snapps.snapp-not-found';
			return fail(400, { message });
		}
		snapp.disabled = disabled;
		await database.snapps.edit({ ...snapp, tags: snapp.tags.map(t => t.slug) }, snapp?.userId, fetch);

		let message: string | undefined = undefined;
		if (err === TAGS_AS_PREFIX) message = 'This Snapps has no prefix selected, please include one.';
		if (err === MAX_SNAPPS_PER_USER) message = 'errors.snapps.max-snapps';
		if (err === SNAPP_ORIGIN_URL_REQUESTED) message = 'errors.snapps.original-url-missing';
		if (err === SNAPP_ORIGIN_URL_BLACKLISTED) message = 'errors.snapps.original-url-blacklisted';
		if (err === UNAUTHORIZED) message = 'errors.unauthorized';
		if (err === ALLOW_UNSECURE_HTTP) message = 'errors.snapps.unallowed-not-https';
		if (message) return fail(400, { message });
		return { message: 'snapps.actions.edited' };
	}
};

const getTimelineValue = async (snappId: string, start: Date, end: Date) => {
	end.setHours(23, 59, 59, 999);

	const usages = await prisma.usages.groupBy({
		by: ['timestamp'],
		where: {
			snappId: snappId,
			timestamp: {
				gte: start,
				lte: end
			}
		},
		_count: {
			_all: true
		},
		orderBy: {
			timestamp: 'asc'
		}
	});
	const dateCountMap = new Map<string, number>();

	usages.forEach((usage) => {
		const date = usage.timestamp.toISOString().split('T')[0];
		if (dateCountMap.has(date)) {
			dateCountMap.set(date, dateCountMap.get(date)! + 1);
		} else {
			dateCountMap.set(date, 1);
		}
	});

	const result = Object.fromEntries(dateCountMap);
	return result;
};
