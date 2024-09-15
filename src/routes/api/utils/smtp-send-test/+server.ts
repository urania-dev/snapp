import { env } from '$env/dynamic/private';
import { database } from '$lib/server/db/database';
import { SMTP_STATUS, SMTP_PORT, SMTP_HOST, SMTP_USER, SMTP_PASS, SMTP_FROM } from '$lib/utils/constants';
import { error, json } from '@sveltejs/kit';

import { createTransport, type Transport, type TransportOptions } from 'nodemailer';

export const GET = async ({ locals: { session,user }, url }) => {

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
        const html = String((await import('$lib/emails/test.html?raw')).default);

        const APPNAME = env.APPNAME || 'Snapp.li';
        const ORIGIN_URL = env.ORIGIN;
        const LOGO_URL = url.origin + '/logo.svg';
        const FROM = await database.settings.get(SMTP_FROM).then((res) => res?.value)
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
