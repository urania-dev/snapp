import type { prisma } from "$lib/db/prisma";
import { log } from "$lib/server/log";
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

function allocateUniform(total: number, daysLen: number): number[] {
	if (total <= 0 || daysLen <= 0) return Array(daysLen).fill(0);
	const base = Math.floor(total / daysLen);
	let rem = total - base * daysLen;
	const arr = Array(daysLen).fill(base);
	for (let i = daysLen - 1; i >= 0 && rem > 0; i--, rem--) arr[i]++;
	return arr;
}

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
		const already = await db.usage.count({
			where: { snappId: target.id }
		});
		if (already === 0) {
			const today = new Date();
			const startCap = new Date(today.getTime() - 365 * DAY);
			const start = createdAt < startCap ? startCap : createdAt;

			const days = enumerateDays(start, today);
			const perDay = allocateUniform(totalHits, days.length);

			const rows: Partial<Usage>[] = [];
			for (let i = 0; i < days.length; i++) {
				const count = perDay[i];
				if (count <= 0) continue;

				for (let k = 0; k < count; k++) {
					const when = randomTimeInDay(days[i]);
					const payload = {
						language: "en-US",
						userAgent: "synthetic",
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
						language: payload.language,
						userAgent: payload.userAgent,
						referrer: payload.referrer,
						device: payload.device,
						country: payload.country,
						region: payload.region,
						city: payload.city,
						os: payload.os,
						browser: payload.browser,
						cpu: payload.cpu
					});
				}
			}

			for (const part of chunk(rows, 1000)) {
				if (part && part.length) {
					await db.usage.createMany({
						data: part as Usage[]
					});
				}
			}
		}
	}
};

import { spawn } from "node:child_process";
import path from "node:path";

export function runMetricsJob(snappId: string, userId: string) {
	const workerPath = path.resolve("./generate-metrics-worker.ts");

	const child = spawn("bun", [workerPath, snappId, userId], {
		detached: true
	});
	child.stdout.on("data", (data) => {
		log.info(`[worker ${snappId}] ${data.toString().trim()}`);
	});

	// log worker stderr
	child.stderr.on("data", (data) => {
		log.info(`[worker ${snappId} ERROR] ${data.toString().trim()}`);
	});

	// detect exit
	child.on("close", (code) => {
		log.info(`[worker ${snappId}] exited with code ${code}`);
	});
	child.unref();
}
