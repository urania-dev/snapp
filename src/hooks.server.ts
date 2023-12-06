import { auth } from '$lib/server/lucia';
import schedule, { scheduledJobs } from 'node-schedule';

import type { Handle } from '@sveltejs/kit';
import { TIMEZONE } from '$env/static/private';
import { prisma } from '$lib/server/prisma';

console.log('🖥️  Starting handle server side');
let jobs = Array.from(Object.entries(scheduledJobs));

export const handle: Handle = async ({ event, resolve }) => {
	event.locals.auth = auth.handleRequest(event);
	const theme = event.cookies.get('u:snappli:theme');
	return await resolve(event, {
		transformPageChunk({ html }) {
			if (theme !== 'light') return html.replace('<body', '<body class="theme-dark"');
			return html;
		}
	});
};

const rule = new schedule.RecurrenceRule();
rule.tz = TIMEZONE;
rule.hour = 0;

let today = new Date();
today.setUTCDate(today.getDate());
today.setUTCHours(0, 0, 0, 0);

async function deleteExpiredSnapps() {
	console.log('🧹 started cleaning service');
	const ids = await prisma.snapp.deleteMany({ where: { expires_at: { lte: today } } });
	console.log(`${ids.count} snapps are expired and have been deleted`);
}

function initiateSchedules() {
	console.log(`🕐 Setting up Scheduled Jobs`);
	jobs.map((j) => schedule.cancelJob(j[1]));
	console.log(`--- 🧹 Cleaning (${jobs.length}) Scheduled Jobs already set.`);

	let job = schedule.scheduleJob(rule, deleteExpiredSnapps);

	if (job !== undefined)
		console.log(
			`--- ✔️ ${' '}(${+Array.from(Object.entries(schedule.scheduledJobs)).length}) Jobs Scheduled`
		);
	else console.log('--- ❌ An error occurred during schedule');
}

initiateSchedules();
