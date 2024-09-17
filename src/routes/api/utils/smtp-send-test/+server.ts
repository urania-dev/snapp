import { env } from '$env/dynamic/private';
import { database } from '$lib/server/db/database';
import { join } from 'path'
import { SMTP_STATUS, SMTP_PORT, SMTP_HOST, SMTP_USER, SMTP_PASS, SMTP_FROM } from '$lib/utils/constants';

import { error, json } from '@sveltejs/kit';

import { createTransport, type Transport, type TransportOptions } from 'nodemailer';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
export const GET = async ({ locals: { session, user }, url }) => {

    try {
        const configPath = join(process.cwd(), 'smtp.config.cjs');
        let smtpConfig = require(configPath) as (_database:typeof database) => Promise<any>;
        const smtp = await smtpConfig(database)
        const transporter = createTransport<Transport>({ ...smtp } as TransportOptions);
        const response = await transporter.verify();
        await database.settings.set(SMTP_STATUS, 'true');
        const html = String((await import('$lib/emails/test.html?raw')).default);

        const APPNAME = env.APPNAME || 'Snapp.li';
        const ORIGIN_URL = env.ORIGIN;
        const LOGO_URL = url.origin + '/logo.svg';
        const FROM = await database.settings.get(SMTP_FROM).then((res) => res?.value) || smtp.auth.user
        const flag = await transporter.sendMail({
            from: APPNAME + ' <' + FROM + '>',
            to: user?.email,
            subject: 'Snapp: Test Mail',
            html: html
                .replaceAll('{APPNAME}', APPNAME)
                .replaceAll('{ORIGIN_URL}', ORIGIN_URL)
                .replaceAll('{LOGO_URL}', LOGO_URL)
        });

        return json(
            { active: true },
        );
    } catch (error) {
        return json({ active: false, error: (error as Error).message });
    }
};

export const fallback = () => error(405);
