import { database } from '$lib/server/db/database';
import { SMTP_STATUS, SMTP_PORT, SMTP_HOST, SMTP_USER, SMTP_PASS } from '$lib/utils/constants';
import { error, json } from '@sveltejs/kit';

import { createTransport, type Transport, type TransportOptions } from 'nodemailer';

export const GET = async () => {
	const weekAgo = new Date();
	weekAgo.setDate(weekAgo.getDate() - 7);

	const status_response = await database.settings.expirable(SMTP_STATUS, weekAgo);
	const smtp_status = database.settings.parse(status_response, true);
	let expiration = (status_response && new Date(status_response.created)) || new Date();
	if (expiration) expiration.setDate(expiration.getDate() + 7) && expiration.setHours(0, 0, 0, 0);
	if (smtp_status === true)
		return json(
			{ active: true, cached: true, expire: expiration },
			{
				headers: {
					'Cache-Control':
						'max-age=' + Math.floor(Math.abs(new Date().getTime() - expiration!.getTime()) / 1000)
				}
			}
		);

	const smtp = {
		host: await database.settings.get(SMTP_HOST).then((res) => res?.value),
		port: await database.settings.get(SMTP_PORT).then((res) => res?.value),
		secure: true,
		auth: {
			user: await database.settings.get(SMTP_USER).then((res) => res?.value),
			pass: await database.settings.get(SMTP_PASS).then((res) => res?.value)
		}
	};

	try {
		const transporter = createTransport<Transport>({ ...smtp } as TransportOptions);
		const response = await transporter.verify();
		await database.settings.set(SMTP_STATUS, 'true');
		if (!expiration) expiration = new Date();
		expiration.setDate(expiration.getDate() + 7) && expiration.setHours(0, 0, 0, 0);

		return json(
			{ active: true },
			{
				headers: {
					'cache-control':
						'max-age=' + Math.floor(Math.abs(new Date().getTime() - expiration.getTime()) / 1000)
				}
			}
		);
	} catch (error) {
		return json({ active: false, error: (error as Error).message });
	}
};

export const fallback = () => error(405);
