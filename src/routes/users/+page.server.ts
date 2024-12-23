import { env } from "$env/dynamic/private";
import { database } from "$lib/server/db/database.js";
import {
  EMAIL_EXISTS,
  ENABLE_LIMITS,
  MAX_SNAPPS_PER_USER,
  SMTP_FROM,
  USER_DOES_NOT_EXISTS,
  USER_EXISTS,
} from "$lib/utils/constants.js";
import { fail, redirect } from "@sveltejs/kit";
import { generateId } from "lucia";
import {
  createTransport,
  type Transport,
  type TransportOptions,
} from "nodemailer";
import { join } from "path";
import { createRequire } from "module";
const require = createRequire(import.meta.url);

export async function load({ locals: { session, user }, url }) {
  if (!user || !session) redirect(302, "/auth/sign-in");

  const is_admin = await database.users.is_admin(user.id);
  if (!is_admin) redirect(302, "/dashboard");

  const limit = parseInt(url.searchParams.get("limit")?.toString() || "9");
  const page = parseInt(url.searchParams.get("page")?.toString() || "1");
  const offset = (page - 1) * limit;
  const query = url.searchParams.get("query")?.toString();
  const enabled_limits = database.settings.parse(
    await database.settings.get(ENABLE_LIMITS),
    true,
  );
  const defaultMaxSnapp = enabled_limits
    ? await database.settings.get(MAX_SNAPPS_PER_USER).then((res) =>
      res?.value || 0
    )
    : 0;
  const [users, count] = await database.users.get(query, limit, offset);
  const _users = Promise.all(
    users.map(async (u) => {
      if (u.role !== "user") return { ...u, max: 0 };
      return {
        ...u,
        max: enabled_limits
          ? await database.settings
            .get(MAX_SNAPPS_PER_USER, u.id)
            .then((res) =>
              (res?.value !== undefined && parseInt(res.value)) ||
              defaultMaxSnapp
            )
          : 0,
      };
    }),
  );

  return { users: await _users, count, query, limit, offset, enabled_limits };
}

export const actions = {
  delete: async ({ locals: { session, user }, request }) => {
    if (!session || !user) redirect(302, "/");
    const form = await request.formData();
    const id = form.get("id")?.toString();
    if (!id) return fail(400, { message: "errors.generic" });
    const [, err] = await database.users.delete(id);
    return { message: err ? err : "users.actions.deleted" };
  },
  edit: async ({ locals: { session }, request }) => {
    if (!session) redirect(302, "/");
    const form = await request.formData();
    const edit_user = form.get("user")?.toString();
    if (!edit_user) return fail(400, { message: "errors.generic" });

    const _user = JSON.parse(edit_user) as User & { max: number };

    const [updated, err] = await database.users.update(
      {
        email: _user.email,
        username: _user.username,
        role: _user.role,
        notes: _user.notes,
        updatedAt: new Date(),
      },
      _user.id,
    );
    let message = null;
    if (err && err === USER_EXISTS) message = "errors.auth.user-already-exists";
    if (err && err === EMAIL_EXISTS) message = "errors.auth.email-registered";
    if (err && err === USER_DOES_NOT_EXISTS) message = "errors.users.not-found";
    if (!updated || message) return fail(500, { message });

    if (_user.max) {
      await database.settings.set(
        MAX_SNAPPS_PER_USER,
        _user.max.toString(),
        updated.id,
      );
    }
    return { message: "users.actions.edited" };
  },
  create: async ({ locals: { session }, request, url, fetch }) => {
    if (!session) redirect(302, "/");
    const form = await request.formData();
    const create_user = form.get("user")?.toString();
    if (!create_user) return fail(400, { message: "errors.generic" });

    const _user = JSON.parse(create_user) as User & {
      max: number | null | undefined;
    };
    const pwd = generateId(12);

    const [created, err] = await database.users.create(
      _user.username,
      _user.email,
      pwd,
      undefined,
      _user.role as "user",
    );
    let message = null;
    if (err && err === USER_EXISTS) message = "errors.auth.user-already-exists";
    if (err && err === EMAIL_EXISTS) message = "errors.auth.email-registered";
    if (!created || message) return fail(500, { message });

    if (_user.max) {
      await database.settings.set(
        MAX_SNAPPS_PER_USER,
        _user.max.toString(),
        created.id,
      );
    }

    const has_smtp = (await (await fetch("/api/utils/smtp-server")).json())
      .active as boolean;
    if (!has_smtp || !_user.email) return { message: "users.actions.created" };

    try {
      const configPath = join(process.cwd(), "smtp.config.cjs");
      const smtpConfig = require(configPath) as (
        _db: typeof database,
      ) => Promise<TransportOptions>;
      const smtp = await smtpConfig(database);

      const from = await database.settings.get(SMTP_FROM).then((res) =>
        res?.value
      );
      const transporter = createTransport<Transport>(
        { ...smtp } as TransportOptions,
      );

      const html = String(
        (await import("$lib/emails/invited.html?raw")).default,
      );

      const APPNAME = env.APPNAME || "Snapp.li";
      const ORIGIN_URL = env.ORIGIN;
      const NAME = created.username;
      const TOKEN = await database.users.reset_token(created.id);
      const URL = url.origin + "/auth/recover-password?token=" + TOKEN;
      const LOGO_URL = url.origin + "/logo.svg";

      await transporter.sendMail({
        from: APPNAME + " <" + from + ">",
        to: created.email,
        subject: "Snapp: Invite to Subscribe",
        html: html
          .replaceAll("{APP_NAME}", APPNAME)
          .replaceAll("{ORIGIN_URL}", ORIGIN_URL || '')
          .replaceAll("{LOGO}", LOGO_URL)
          .replaceAll("{NAME}", NAME)
          .replaceAll("{URL}", URL),
      });

      return { message: "users.actions.created" };
    } catch (error) {
      console.log(error);
      return { sent: false };
    }
  },
};
