import { database } from '$lib/server/db/database.js';
import { prisma } from '$lib/server/prisma';
import { fail, redirect } from '@sveltejs/kit';

export const load = async ({ locals: { session, user }, request, params: { id }, url }) => {
	if (!session || !user) redirect(302, '/auth/sign-in');
	if (!id) redirect(302, '/dashboard');

	const startString = url.searchParams.get('start')?.toString() || undefined;
	const endString = url.searchParams.get('end')?.toString() || undefined;
	const [snapp, err] = await database.snapps.id(id);
	if (!snapp) redirect(302, '/dashboard');
	let start = startString ? new Date(startString) : new Date();
	let end = endString ? new Date(endString) : new Date();

	if (!startString || !endString) start.setTime(end.getTime() - 7 * 24 * 60 * 60 * 1000);

	if (!snapp || err) redirect(302, '/dashboard');
	const metrics = await getTimelineValue(snapp.id, start, end);
	const totalVisits = await prisma.usages.count({ where: { snappId: snapp.id } });
	return { snapp, metrics, start, end, totalVisits, origin:url.origin };
};

export const actions = {
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

		await database.snapps.edit(snapp, snapp?.userId, fetch);
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
