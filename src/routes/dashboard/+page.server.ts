import { database } from "$lib/server/db/database.js";
import { getServerSideSettings } from "$lib/server/server-wide-settings/index.js";
import {
  ALLOW_UNSECURE_HTTP,
  MAX_SNAPPS_PER_USER,
  SNAPP_NOT_FOUND,
  SNAPP_ORIGIN_URL_BLACKLISTED,
  SNAPP_ORIGIN_URL_REQUESTED,
  TAGS_AS_PREFIX,
  UNAUTHORIZED,
} from "$lib/utils/constants.js";
import type { Prisma } from "@prisma/client";

import { fail, redirect } from "@sveltejs/kit";

export async function load({ locals: { session, user }, url }) {
  if (!user || !session) redirect(302, "/auth/sign-in");

  const allow_http = database.settings.parse(
    await database.settings.get(ALLOW_UNSECURE_HTTP),
    true,
  );

  const customLimit = await database.settings
    .get("ROWS", user.id)
    .then((res) => (res?.value && parseInt(res.value)) || -1);

  const limit = customLimit !== -1
    ? customLimit
    : parseInt(url.searchParams.get("limit")?.toString() || "14");

  const page = parseInt(url.searchParams.get("page")?.toString() || "1");
  const orderBy = url.searchParams.get("order-by")?.toString() ||
    ("created" as keyof Prisma.SnappOrderByWithRelationInput);
  const ascending =
    url.searchParams.get("ascending")?.toString()?.toLowerCase() === "false" ||
    false;
  const offset = (page - 1) * limit;

  const query = url.searchParams.get("query")?.toString();

  const cols = await database.settings
    .get("COLUMNS", user.id)
    .then((res) =>
      (res?.value && (JSON.parse(res.value) as string[])) || ["shortcode"]
    );
  const [snapps, count] = await database.snapps.get(
    user.id,
    query,
    limit,
    offset,
    {
      [orderBy]: ascending ? "asc" : "desc",
    },
  );
  const settings = getServerSideSettings();
  const tagsAsPrefix = settings.get(TAGS_AS_PREFIX);

  const tagQuery = url.searchParams.get("tag-query")?.toString();
  const [tags, countTag] = await database.tags.get(user.id, tagQuery, 3, 0, {
    name: "asc",
  });
  return {
    allow_http,
    snapps: snapps,
    count,
    offset,
    page,
    limit,
    cols,
    protocol: url.protocol,
    tagsAsPrefix,
    tags,
    countTag,
  };
}

export const actions = {
  create: async ({ locals: { session }, request, fetch }) => {
    if (!session) redirect(302, "/");

    const form = await request.formData();
    const create_snapp = form.get("snapp")?.toString();

    if (!create_snapp) {
      return fail(400, { message: "errors.snapps.original-url-missing" });
    }
    const tagsString = form.get("tags")?.toString() || "[]";
    const tags = JSON.parse(tagsString) as string[];
    const settings = getServerSideSettings();
    const tagsAsPrefix = settings.get<boolean>(TAGS_AS_PREFIX);
    if (!tags?.length && tagsAsPrefix === true) {
      return fail(400, { message: "errors.snapps.no-prefix" });
    }
    const [, err] = await database.snapps.create(
      { ...JSON.parse(create_snapp), tags },
      session.userId,
      fetch,
    );

    let message: string | undefined = undefined;

    if (err === TAGS_AS_PREFIX) message = "errors.snapps.no-prefix";
    else if (err === MAX_SNAPPS_PER_USER) message = "errors.snapps.max-snapps";
    else if (err === SNAPP_ORIGIN_URL_REQUESTED) {
      message = "errors.snapps.original-url-missing";
    } else if (err === SNAPP_ORIGIN_URL_BLACKLISTED) {
      message = "errors.snapps.original-url-blacklisted";
    } else if (err === ALLOW_UNSECURE_HTTP) {
      message = "errors.snapps.unallowed-not-https";
    }
    if (message) return fail(400, { message });

    return { message: "snapps.actions.created", success: true };
  },
  edit: async ({ locals: { session }, request, fetch }) => {
    if (!session) redirect(302, "/");

    const form = await request.formData();
    const edit_snapp = form.get("snapp")?.toString();

    if (!edit_snapp) {
      return fail(400, { message: "errors.snapps.original-url-missing" });
    }
    const settings = getServerSideSettings();
    const tagsAsPrefix = settings.get(TAGS_AS_PREFIX);
    const tagsString = form.get("tags")?.toString() || "[]";
    const tags = JSON.parse(tagsString) as string[];
    if (!tags.length && tagsAsPrefix) {
      return fail(400, { message: "errors.snapps.no-prefix" });
    }
    const [, err] = await database.snapps.edit(
      { ...(JSON.parse(edit_snapp)), tags },
      session.userId,
      fetch,
    );

    let message: string | undefined = undefined;
    if (err === TAGS_AS_PREFIX) message = "errors.snapps.no-prefix";
    if (err === MAX_SNAPPS_PER_USER) message = "errors.snapps.max-snapps";
    if (err === SNAPP_ORIGIN_URL_REQUESTED) {
      message = "errors.snapps.original-url-missing";
    }
    if (err === SNAPP_ORIGIN_URL_BLACKLISTED) {
      message = "errors.snapps.original-url-blacklisted";
    }
    if (err === UNAUTHORIZED) message = "errors.unauthorized";
    if (err === ALLOW_UNSECURE_HTTP) {
      message = "errors.snapps.unallowed-not-https";
    }
    if (message) return fail(400, { message });

    return { message: "snapps.actions.edited", success: true };
  },
  delete: async ({ locals: { session, user }, request }) => {
    if (!session || !user) redirect(302, "/");

    const form = await request.formData();
    const { id } = (form.get("snapp")?.toString() || false) &&
      JSON.parse(form.get("snapp")!.toString());

    const [, err] = await database.snapps.delete(user.id, id);
    let message: string | undefined = undefined;
    if (err === SNAPP_NOT_FOUND) message = "errors.snapps.not-found";
    if (err === UNAUTHORIZED) message = "errors.unauthorized";
    if (message) return fail(400, { message });

    return { message: "snapps.actions.deleted", success: true };
  },
  "delete-all": async ({ locals: { session, user }, request }) => {
    if (!session || !user) redirect(302, "/");

    const form = await request.formData();
    const ids = form.get("ids")?.toString() &&
      JSON.parse(form.get("ids")!.toString());
    for (const id of ids) {
      let message: string | undefined = undefined;
      const [, err] = await database.snapps.delete(user.id, id);
      if (err === SNAPP_NOT_FOUND) message = "errors.snapps.not-found";
      if (err === UNAUTHORIZED) message = "errors.unauthorized";
      if (message) return fail(400, { message });
    }

    return { message: "snapps.actions.deleted", success: true };
  },

  "save-cols": async ({ locals: { session, user }, request }) => {
    if (!session || !user) redirect(302, "/");
    const form = await request.formData();

    const cols = form.get("columns")?.toString();
    if (cols) await database.settings.set("COLUMNS", cols, user.id);
  },
  "save-rows": async ({ locals: { session, user }, request }) => {
    if (!session || !user) redirect(302, "/");
    const form = await request.formData();

    const cols = form.get("rows")?.toString();
    if (cols) await database.settings.set("ROWS", cols, user.id);
  },
};
