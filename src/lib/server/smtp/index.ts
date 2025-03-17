/* eslint-disable @typescript-eslint/no-explicit-any */

import type { Transport } from '@sveltejs/kit';
import type { Component, ComponentProps } from 'svelte';

import Emailer, { inline } from '@uraniadev/emailer';
import { createRequire } from 'module';
import { createTransport, type TransportOptions } from 'nodemailer';
import { join } from 'path';

import { getSettings } from '../config';
import { log } from '../log';

export const getSMTP = async () => {
	const serverSettings = await getSettings();
	const require = createRequire(import.meta.url);

	const smtpConfig = require(join(process.cwd(), 'smtp.config.cjs')) as (
		settings: typeof serverSettings
	) => Promise<{
		auth: { [key: string]: string };
		host: string;
		port: number;
		secure: boolean;
	}>;

	const config = smtpConfig(serverSettings);
	return config;
};

export const sendEmail = async <T extends Component<any, any, string>>(
	email: T,
	args: ComponentProps<T>,
	to: string,
	subject: string
) => {
	try {
		const smtp = await getSMTP();

		const transporter = createTransport<Transport>({ ...smtp } as TransportOptions);
		const settings = await getSettings();
		const from = settings.get<string>('SMTP_FROM') || process.env.SMTP_USER;
		const emailer = new Emailer();
		const html = emailer.render(email, args, {
			dir: 'ltr',
			lang: 'en',
			props: {
				body: [`style=${inline('bg-neutral-900 text-neutral-50')}`],
				container: [`style=${inline('max-w-[620px] mx-auto py-4')}`],
				html: [`style=${inline('bg-neutral-900 text-neutral-50 p-4')}`]
			},
			style: ''
		});

		await transporter.sendMail({ from, html, subject, to });
	} catch (error) {
		if (process.env.LOG_LEVEL === 'debug') log.error(error);
	}
};

export const testTransport = async <T extends Component<any, any, string>>(
	email: T,
	args: ComponentProps<T>,
	to: string,
	subject: string
) => {
	const smtp = await getSMTP();
	const transporter = createTransport<Transport>({ ...smtp } as TransportOptions);

		const settings = await getSettings();
		const from = settings.get<string>('SMTP_FROM') || process.env.SMTP_USER;
		const emailer = new Emailer();
		const html = emailer.render(email, args, {
			dir: 'ltr',
			lang: 'en',
			props: {
				body: [`style=${inline('bg-neutral-900 text-neutral-50')}`],
				container: [`style=${inline('max-w-[620px] mx-auto py-4')}`],
				html: [`style=${inline('bg-neutral-900 text-neutral-50 p-4')}`]
			},
			style: ''
		});
		const verify = await transporter.verify()

		if (process.env.LOG_LEVEL === 'debug') 
			log.info({'VERIFY SMTP: ': {verify}});
		
		log.info({from,smtp})
		await transporter.sendMail({ from, html, subject, to });
};
