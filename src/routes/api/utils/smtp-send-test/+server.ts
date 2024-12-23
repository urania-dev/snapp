import { env } from "$env/dynamic/private";
import { database } from "$lib/server/db/database";
import { join } from "path";
import {
  SMTP_FROM,
  SMTP_HOST,
  SMTP_PASS,
  SMTP_PORT,
  SMTP_STATUS,
  SMTP_USER,
} from "$lib/utils/constants";

import { error, json } from "@sveltejs/kit";

import {
  createTransport,
  type Transport,
  type TransportOptions,
} from "nodemailer";
import { createRequire } from "module";
const require = createRequire(import.meta.url);
export const GET = async ({ locals: { user }, url }) => {
  try {
    const configPath = join(process.cwd(), "smtp.config.cjs");
    const smtpConfig = require(configPath) as (
      _database: typeof database,
    ) => Promise<any>;
    const smtp = await smtpConfig(database);
    const transporter = createTransport<Transport>(
      { ...smtp } as TransportOptions,
    );
    await transporter.verify();
    await database.settings.set(SMTP_STATUS, "true");
    const html = String((await import("$lib/emails/test.html?raw")).default);

    const APPNAME = env.APPNAME || "Snapp.li";
    const ORIGIN_URL = env.ORIGIN;
    const LOGO_URL = url.origin + "/logo.svg";
    const FROM = await database.settings.get(SMTP_FROM).then((res) =>
      res?.value
    ) || smtp.auth.user;
    await transporter.sendMail({
      from: APPNAME + " <" + FROM + ">",
      to: user?.email,
      subject: "Snapp: Test Mail",
      html: html
        .replaceAll("{APPNAME}", APPNAME)
        .replaceAll("{ORIGIN_URL}", ORIGIN_URL || '')
        .replaceAll("{LOGO_URL}", LOGO_URL),
    });

    return json(
      { active: true },
    );
  } catch (error) {
    return json({ active: false, error: (error as Error).message });
  }
};

export const fallback = () => error(405);
