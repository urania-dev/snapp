import { prisma } from '$lib/server/prisma.js';
import type { Prisma } from '@prisma/client';
import { fail, redirect } from '@sveltejs/kit';
import Country from '$lib/comps/map/country.json';

function getLocaleByCountryName(countryName: string): string | undefined {
	return Country.find((c) => c.name === countryName)?.code;
}

export async function load({ locals, request, url, depends, cookies }) {
	depends('u:metrics');
	const session = await locals.auth.validate();
	if (!session) throw redirect(302, '/');

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
					snapp: { user_id: session.user.userId },
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
					user_id: session.user.userId
				}
			}
		}),
		totalSnapps: prisma.snapp.count({ where: { user_id: session.user.userId } }),
		topSnapps: prisma.snapp.findMany({
			where: {
				user_id: session.user.userId
			},
			include: {
				_count: true
			},
			take: 5,
			orderBy: {
				usages: { _count: 'desc' }
			}
		}),
		countries: prisma.urlUsage
			.groupBy({
				by: ['country'],
				_count: true,
				where: { snapp: { user_id: session.user.userId } },
				orderBy: { _count: { country: 'desc' } }
			})
			.then((res) =>
				res.map((c) => ({
					...c,
					short: getLocaleByCountryName(c.country!)?.toLowerCase() ?? 'null',
					country: c.country === null ? 'null' : c.country
				}))
			),
		devices: await prisma.urlUsage.groupBy({
			by: ['device'],
			where: { snapp: { user_id: session.user.userId } },
			_count: true
		}),

		cpu: prisma.urlUsage.groupBy({
			by: ['cpu'],
			where: { snapp: { user_id: session.user.userId } },
			_count: true
		}),
		os: prisma.urlUsage.groupBy({
			by: ['os'],
			where: { snapp: { user_id: session.user.userId } },
			_count: true
		}),
		browser: prisma.urlUsage.groupBy({
			by: ['browser'],
			where: { snapp: { user_id: session.user.userId } },
			_count: true
		})
	};
}
