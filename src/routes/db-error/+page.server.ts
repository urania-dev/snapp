import { redirect } from '@sveltejs/kit';
import { getSettings } from '$lib/server/config';
import DbErrorEmail from '$lib/server/emails/dbErrorEmail.svelte';
import { log } from '$lib/server/log';
import { sendEmail } from '$lib/server/smtp';
import { logDatabaseNotAvailable } from '$lib/umami';



const hasSentEmail = {
	sent: null as Date | null
};

export const load = async (event) => {
	const settings = await getSettings();
	const DATABASE_OFFLINE = settings.get<boolean>('DB_OFFLINE');
	if (!DATABASE_OFFLINE) redirect(302, '/dashboard');
	try {
		if (
			hasSentEmail.sent === null ||
			new Date().getTime() - hasSentEmail.sent.getTime() > 1000 * 60 * 60
		) {
			await sendEmail(DbErrorEmail, {}, process.env.ADMIN_EMAIL || '', 'SNAPP DB OFFLINE');
			hasSentEmail.sent = new Date();
		}
		logDatabaseNotAvailable(event)
	} catch (error) {
		if (process.env.LOG_LEVEL === 'debug') log.error(error);
	}
};

