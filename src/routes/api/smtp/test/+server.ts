import getLanguage from '$lib/api/utils/getLanguage';
import { db } from '$lib/db';
import { error, json } from '@sveltejs/kit';
import { createTransport, type TransportOptions } from 'nodemailer';

export async function GET() {
	const EN = await getLanguage();
	const host = await db.getSetting('settings:app:smtp:host');
	const pass = await db.getSetting('settings:app:smtp:pass');
	const port = await db.getSetting('settings:app:smtp:port');
	const user = await db.getSetting('settings:app:smtp:user');

	if (!host || !pass || !port || !user)
		return json({
			message: EN?.['settings:app:smtp:not:working'],
			active_smtp: false
		});

	const smtp = {
		host,
		port,
		secure: true,
		auth: {
			pass,
			user
		}
	};
	const cached = await db.redis.get('cache:smtp:check');
	if (cached === 'true')
		return json({ message: EN?.['settings:app:smtp:working'], active_smtp: true });

	const transporter = createTransport({ ...smtp } as TransportOptions);

	try {
		const response = await transporter.verify();
		await db.redis.set('cache:smtp:check', `${response}`);
		await db.redis.expire('cache:smtp:check', 60 * 60 * 24);
		return json(
			{
				message: EN?.['settings:app:smtp:working'],
				active_smtp: true
			},
			{
				headers: {
					'cache-control': 'max-age=' + 60 * 60 * 24
				}
			}
		);
	} catch (err) {
		return json({
			state: 200,
			active_smtp: false,
			error: err,
			message: EN?.['settings:app:smtp:not:working']
		});
	}
}
