import getLanguage from '$lib/api/utils/getLanguage.js';
import { db } from '$lib/db';
import { json, error, redirect } from '@sveltejs/kit';
import { createTransport, type TransportOptions } from 'nodemailer';

export async function POST({ request, url }) {
	const token = request.headers.get('authorization')?.split('Bearer ')[1]?.toString().trim();
	if (!token) throw error(401, { message: 'auth:not:authenticated' });
	const validToken = await db.apikeys.search().where('id').equalTo(token).first();
	if (validToken === null) throw error(401, { message: 'auth:not:authorized' });

	const EN = await getLanguage();
	const from = await db.getSetting('settings:app:smtp:from');
	const host = await db.getSetting('settings:app:smtp:host');
	const pass = await db.getSetting('settings:app:smtp:pass');
	const port = await db.getSetting('settings:app:smtp:port');
	const user = await db.getSetting('settings:app:smtp:user');
	if (!host || !pass || !port || !user || !from)
		return json({
			message: EN['settings:app:smtp:not:working'],
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

	const transporter = createTransport({ ...smtp } as TransportOptions);

	try {
		const html = String((await import('$lib/email/base.html?raw')).default);

		const form = await request.formData();
		const to = form.get('to')?.toString()?.trim();
		const APP_NAME = form.get('app_name')?.toString()?.trim() ?? 'SNAPP';
		const EMAIL_OBJECT = form.get('email_object')?.toString()?.trim() ?? 'MALFORMED EMAIL OBJECT';
		const EMAIL_DESCRIPTION =
			form.get('email_description')?.toString()?.trim() ??
			'There is something causing an error during email creation';
		const EMAIL_FOOTER =
			form.get('email_footer')?.toString()?.trim() ??
			'Snapp.li // yet another self-hostable fully featured url shortner';
		const OUT_TEXT =
			form.get('outer_text')?.toString()?.trim() ??
			'This is an auto-generated email. Please do not reply to this address. If you need assistance contact <a href="' +
				url.href +
				'">System Manager</a>';

		const paragraph_start = `<p class="leading-7 text-white mb-4 text-base" style="margin-bottom: 12px; color:white; font-size: 16px; line-height: 28px">`;
		const paragraph_close = `</p>`;

		const paragraphs = EMAIL_DESCRIPTION?.split('. ') ?? [];

		const content = paragraphs.map((text) => paragraph_start + text + paragraph_close);

		const flag = await transporter.sendMail({
			from: `${APP_NAME} <${from}>`,
			to: to,
			subject: EMAIL_OBJECT,
			html: html
				.replace('{APP_NAME}', APP_NAME)
				.replace('{EMAIL_OBJECT}', EMAIL_OBJECT)
				.replace('{EMAIL_DESCRIPTION}', content.join(''))
				.replace('{EMAIL_FOOTER}', EMAIL_FOOTER)
				.replace('{OUT_TEXT}', OUT_TEXT)
		});


		return json({
			message: 'settings:app:smtp:working',
			
		});
	} catch (err) {
		throw error(500, {
			message: 'settings:app:smtp:not:working'
		});
	}
}
