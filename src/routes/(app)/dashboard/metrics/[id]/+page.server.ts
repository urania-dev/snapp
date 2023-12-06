import { prisma } from '$lib/server/prisma.js';
import type { Prisma } from '@prisma/client';
import { error, fail, redirect } from '@sveltejs/kit';
import Country from '$lib/comps/map/country.json';

function getLocaleByCountryName(countryName: string): string | undefined {
	return Country.find((c) => c.name === countryName)?.code;
}

export async function load({ params: { id }, locals, request, url, depends }) {
	depends('u:metrics:id');
	depends('u:snappli:theme');
	const session = await locals.auth.validate();
	if (!session) throw redirect(302, '/');
	const snapp = await prisma.snapp.findFirst({
		where: {
			id,
			user_id: session.user.userId
		},
		select: {
			id: false,
			original_url: true,
			short_code: true,
			created_at: true,
			expires_at: true,
			secret: false,
			has_secret: true,
			user_id: true
		}
	});
	if (!snapp) throw error(404, { message: 'Snapp not found. Does this short link still exists?' });
	let startDateParam = url.searchParams.get('starting_date')?.toString();
	let endDateParam = url.searchParams.get('starting_date')?.toString();

	let end_date: number = new Date().setHours(23, 59, 59, 999);

	if (endDateParam) end_date = new Date(endDateParam).setHours(0, 0, 0, 0); // Set the time to the beginning of the day

	let start_date = new Date(end_date);
	if (startDateParam) start_date = new Date(startDateParam);
	else start_date.setDate(start_date.getDate() - 7);

	return {
		usagesPerDay: prisma.urlUsage
			.groupBy({
				by: ['timestamp'],
				where: {
					snapp_id: id,
					timestamp: {
						gte: start_date.toISOString(),
						lte: new Date(end_date).toISOString()
					}
				},
				_count: {
					id: true
				}
			})
			.then((res) => {
				let days: {
					day: string;
					count: number;
				}[] = [];

				res.map((r) => {
					const day = r.timestamp.toISOString().split('T')[0];
					const exists = days.find((d) => d.day === day);
					if (exists)
						days = [
							...days.filter((d) => d.day !== day),
							{ day: exists.day, count: exists.count + r._count.id }
						];
					else days.push({ day, count: r._count.id });
				});

				return days;
			}),
		totalUses: prisma.urlUsage.count({
			where: {
				snapp: {
					id,
					user_id: session.user.userId
				}
			}
		}),
		snapp,
		countries: prisma.urlUsage
			.groupBy({
				by: ['country'],
				where: { snapp: { id } },
				_count: true,
				orderBy: { _count: { country: 'desc' } }
			})
			.then((res) =>
				res.map((c) => ({
					...c,
					short: getLocaleByCountryName(c.country!)?.toLowerCase() ?? 'null',
					country: c.country === null ? 'null' : c.country
				}))
			),
		devices: prisma.urlUsage
			.groupBy({
				by: ['device'],
				where: { snapp: { user_id: session.user.userId, id } },
				_count: true
			})
			.then((res) => {
				let devices = {};
				return res;
			}),
		cpu: prisma.urlUsage.groupBy({
			by: ['cpu'],
			where: { snapp: { user_id: session.user.userId, id } },
			_count: true
		}),
		os: prisma.urlUsage.groupBy({
			by: ['os'],
			where: { snapp: { user_id: session.user.userId, id } },
			_count: true
		}),
		browser: prisma.urlUsage.groupBy({
			by: ['browser'],
			where: { snapp: { user_id: session.user.userId, id } },
			_count: true
		})
	};
}
