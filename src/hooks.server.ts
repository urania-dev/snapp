import { auth } from '$lib/server/lucia';
import schedule, { scheduledJobs } from 'node-schedule';
import { execSync } from 'child_process';
import type { Handle } from '@sveltejs/kit';
import { prisma } from '$lib/server/prisma';
import { env } from '$env/dynamic/private';

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
rule.tz = process.env.TIMEZONE ?? 'Europe/Rome';
rule.hour = 0;
rule.minute = 0;

async function deleteExpiredSnapps() {
	let today = new Date();
	today.setUTCDate(today.getDate());
	today.setUTCHours(0, 0, 0, 0);
	console.log('🧹 started cleaning service');

	const ids = await prisma.snapp.deleteMany({
		where: { expires_at: { lte: today } }
	});

	console.log(`${ids.count} snapps are expired and have been deleted`);
}

async function deleteOldUsages() {
	let today = new Date();
	today.setUTCDate(today.getDate());
	today.setUTCHours(0, 0, 0, 0);
	let olderThan = new Date();
	olderThan.setUTCDate(
		today.getUTCDate() -
			(process.env.METRIC_RETENTION_DAYS !== 'false'
				? Number(process.env.METRIC_RETENTION_DAYS?.toString())
				: 30)
	);
	olderThan.setUTCHours(0, 0, 0, 0);
	const res = await prisma.urlUsage.deleteMany({
		where: {
			timestamp: { lte: olderThan }
		}
	});

	console.log('♻️ cleaning old metrics. [' + res.count + '] object erased');
}
async function resetDemo() {
	console.log('♻️ resetting demo service');

	const users = await prisma.user.deleteMany({
		where: {
			id: { not: '' }
		}
	});

	if (process.env.METRIC_RETENTION_DAYS !== 'false') await deleteOldUsages();

	console.log(`${users.count} users have been deleted`);
	console.log(`Instance has been reset`);
}

function initiateSchedules() {
	console.log(`🕐 Setting up Scheduled Jobs`);
	jobs.map((j) => schedule.cancelJob(j[1]));
	console.log(`--- 🧹 Cleaning (${jobs.length}) Scheduled Jobs already set.`);

	let job = schedule.scheduleJob(rule, deleteExpiredSnapps);

	if (process.env.DEMO === 'true') schedule.scheduleJob(rule, resetDemo);

	if (job !== undefined)
		console.log(
			`--- ✔️ ${' '}(${+Array.from(Object.entries(schedule.scheduledJobs)).length}) Jobs Scheduled`
		);
	else console.log('--- ❌ An error occurred during schedule');
}

async function checkDb() {
	console.log(execSync('npx prisma db push').toString());

	console.log('Database is up to date.');
	if (env.ADMIN_USERNAME && env.ADMIN_PASSWORD) {
		const findAdmin = await prisma.user.findFirst({ where: { username: env.ADMIN_USERNAME } });
		if(findAdmin !== null) return console.log('Admin already set on this DB.')
		const user = await auth.createUser({
			key: {
				providerId: 'username', // auth method
				providerUserId: env.ADMIN_USERNAME, // unique id when using "username" auth method
				password: env.ADMIN_PASSWORD // hashed by Lucia
			},
			attributes: {
				username: env.ADMIN_USERNAME,
				email: env.ADMIN_EMAIL ?? null
			}
		});
		await prisma.settings.upsert({
			create: {
				id: user.userId + ':isadmin',
				user_id: user.userId,
				setting: 'administrator',
				value: 'true'
			},
			update: {
				value: 'true'
			},
			where: {
				id: user.userId + ':isadmin'
			}
		});
		console.log('Admin has been set as variables');
	}
}

checkDb();
initiateSchedules();
