import { database } from '$lib/server/db/database.js';
import { prisma } from '$lib/server/prisma';
import { redirect } from '@sveltejs/kit';
import { countryToAlpha2 } from 'country-to-iso';
export const load = async ({ locals: { session, user }, request, url }) => {
	if (!session || !user) redirect(302, '/auth/sign-in');

	const startString = url.searchParams.get('start')?.toString() || undefined;
	const endString = url.searchParams.get('end')?.toString() || undefined;
	let country = url.searchParams.get('country')?.toString() || undefined;
	let browser = url.searchParams.get('browser')?.toString() || undefined;
	let os = url.searchParams.get('os')?.toString() || undefined;
	let device = url.searchParams.get('device')?.toString() || undefined;

	const is_admin = await database.users.is_admin(user.id);

	let start = startString ? new Date(startString) : new Date();
	let end = endString ? new Date(endString) : new Date();

	if (!startString || !endString) start.setTime(end.getTime() - 7 * 24 * 60 * 60 * 1000);

	if (country?.toLowerCase() === 'world') country = undefined;
	if (browser?.toLowerCase() === 'all') browser = undefined;
	if (os?.toLowerCase() === 'all') os = undefined;
	if (device?.toLowerCase() === 'all') device = undefined;

	const metrics = await getTimelineValue(
		start,
		end,
		is_admin ? undefined : user.id,
		country,
		browser,
		os,
		device
	);
	const totalVisits = await prisma.usages.count({
		where: { snappUserId: is_admin ? undefined : user.id, country, browser, os }
	});
	const oss = await prisma.usages
		.groupBy({ by: ['os'], where: { snappUserId: is_admin ? undefined : user.id }, _count: true })
		.then((res) => res.map((item) => ({ id: item.os, name: item.os, value: item._count })));
	const browsers = await prisma.usages
		.groupBy({
			by: ['browser'],
			where: { snappUserId: is_admin ? undefined : user.id },
			_count: true
		})
		.then((res) =>
			res.map((item) => ({ id: item.browser, name: item.browser, value: item._count }))
		);
	const devices = await prisma.usages
		.groupBy({
			by: ['device'],
			where: { snappUserId: is_admin ? undefined : user.id },
			_count: true
		})
		.then((res) => res.map((item) => ({ id: item.device, name: item.device, value: item._count })));
	const countries = await prisma.usages
		.groupBy({
			by: ['country'],
			where: { snappUserId: is_admin ? undefined : user.id },
			_count: true
		})
		.then((res) =>
			res.map((item) => ({
				id: item.country ? countryToAlpha2(item.country) : null,
				name: item.country,
				value: item._count
			}))
		);
	return { metrics, start, end, totalVisits, countries, browsers, oss, devices };
};

const getTimelineValue = async (
	start: Date,
	end: Date,
	userId?: string,
	country?: string,
	browser?: string,
	os?: string,
	device?: string
) => {
	end.setHours(24, 59, 59, 9999);
	const mapped = new Map<string, number>();
	const values = await prisma.usages
		.findMany({
			where: {
				snappUserId: userId,
				browser,
				country,
				os,
				device,
				AND: [{ timestamp: { lte: end } }, { timestamp: { gte: start } }]
			},
			select: { timestamp: true }
		})
		.then((res) => res.map((t) => t.timestamp.toISOString().split('T')[0]));

	for (let idx in values) {
		if (mapped.has(values[idx])) mapped.set(values[idx], mapped.get(values[idx])! + 1);
		else mapped.set(values[idx], 1);
	}

	return Object.fromEntries(mapped);
};
