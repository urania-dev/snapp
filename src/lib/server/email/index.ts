import { createTransport } from 'nodemailer';

import { CONSTANTS } from '../const';
import { settings } from '../settings';
export const getSMTP = async () => {
	const config = settings.get();
	if (!config.smtp.enabled) return null;
	const { from, host, pass, port, secure = false, user } = config.smtp;
	if (!host || !user || !pass || !from || !port) return null;
	const smtp = createTransport({
		auth: {
			pass,
			user
		},
		from,
		host,
		port,
		secure
	});
	try {
		await smtp.verify();
	} catch {
		if (CONSTANTS.DEBUG) console.log('[smtp]', 'SMTP is disabled after test');
		return null;
	}
	return smtp;
};
