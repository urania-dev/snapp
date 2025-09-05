import type { prisma } from "$lib/db/prisma";
import type { Snapp, Usage } from "@prisma/client";

const DAY = 24 * 60 * 60 * 1000;

function clampToDate(d: Date) {
	return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

function enumerateDays(start: Date, end: Date) {
	const days: Date[] = [];
	const d0 = clampToDate(start);
	const d1 = clampToDate(end);
	for (let t = d0.getTime(); t <= d1.getTime(); t += DAY) days.push(new Date(t));
	return days;
}

/** Uniform allocation; remainder given to the most recent days. */
function allocateUniform(total: number, daysLen: number): number[] {
	if (total <= 0 || daysLen <= 0) return Array(daysLen).fill(0);
	const base = Math.floor(total / daysLen);
	let rem = total - base * daysLen;
	const arr = Array(daysLen).fill(base);
	// give +1 to the last `rem` days (most recent)
	for (let i = daysLen - 1; i >= 0 && rem > 0; i--, rem--) arr[i]++;
	return arr;
}

/** Random time inside a given UTC day */
function randomTimeInDay(dayUTC: Date) {
	const h = Math.floor(Math.random() * 24);
	const m = Math.floor(Math.random() * 60);
	const s = Math.floor(Math.random() * 60);
	return new Date(dayUTC.getTime() + h * 3600000 + m * 60000 + s * 1000);
}

function chunk<T>(arr: T[], size = 1000) {
	const out: T[][] = [];
	for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
	return out;
}
export const generateMetrics = async (target: Snapp, userId: string, db: typeof prisma) => {
	console.log(target);
	const totalHits = Number(target.hit ?? 0);
	const createdAt = new Date(target.createdAt || Date.now());
	console.log(totalHits);
	if (totalHits > 0) {
		// Skip if we already have usage rows for this snapp
		const already = await db.usage.count({
			where: { snappId: target.id }
		});
		if (already === 0) {
			// Cap to last 365 days to avoid super thin tails on very old links.
			const today = new Date();
			const startCap = new Date(today.getTime() - 365 * DAY);
			const start = createdAt < startCap ? startCap : createdAt;

			const days = enumerateDays(start, today);
			const perDay = allocateUniform(totalHits, days.length);

			// Build UsageCreateManyInput[]
			const rows: Partial<Usage>[] = [];
			for (let i = 0; i < days.length; i++) {
				const count = perDay[i];
				if (count <= 0) continue;

				for (let k = 0; k < count; k++) {
					const when = randomTimeInDay(days[i]);
					const ua = {
						language: "en-US",
						userAgent: "Mozilla/5.0 (X11; Linux x86_64; rv:125.0) Gecko/20100101 Firefox/125.0",
						device: "syntethic",
						os: "syntethic",
						browser: "Syntethic",
						cpu: null,
						referrer: null,
						country: null,
						region: null,
						city: null
					};

					rows.push({
						timestamp: when,
						snappId: target.id,
						ownerId: userId,
						language: ua.language,
						userAgent: ua.userAgent,
						referrer: ua.referrer,
						device: ua.device,
						country: ua.country,
						region: ua.region,
						city: ua.city,
						os: ua.os,
						browser: ua.browser,
						cpu: ua.cpu
						// if you have a 'source' field add: source: 'synthetic'
					});
				}
			}

			// Insert in chunks for memory/perf
			for (const part of chunk(rows, 1000)) {
				if (part && part.length) {
					await db.usage
						.createMany({
							data: part as Usage[]
						})
						.then((c) => console.log(c));
				}
			}
		}
	}
};
