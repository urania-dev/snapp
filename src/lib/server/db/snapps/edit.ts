import { prisma } from "$lib/server/prisma";
import {
  ALLOW_UNSECURE_HTTP,
  SNAPP_ORIGIN_URL_BLACKLISTED,
  SNAPP_ORIGIN_URL_REQUESTED,
  TAGS_AS_PREFIX,
  UNAUTHORIZED,
} from "$lib/utils/constants";
import { hash } from "@node-rs/argon2";
import { generateId } from "lucia";
import { database } from "../database";
import { getServerSideSettings } from "$lib/server/server-wide-settings";

export const edit_snapp = async (
  snapp: Snapp & { tags: string[] },
  userId: string,
  fetch: SvelteFetch,
) => {
  const is_admin = await database.users.is_admin(userId);

  const {
    id,
    original_url,
    userId: snappUserId,
    notes,
    secret,
    expiration,
    max_usages,
    disabled,
    tags,
  } = snapp;
  let shortcode = snapp.shortcode
  if (!is_admin && snappUserId !== userId) {
    return [null, UNAUTHORIZED] as [null, string];
  }
  if (
    !original_url || typeof original_url !== "string" ||
    original_url.trim() === ""
  ) {
    return [null, SNAPP_ORIGIN_URL_REQUESTED] as [null, string];
  }

  const allow_http = database.settings.parse(
    await database.settings.get(ALLOW_UNSECURE_HTTP),
    true,
  );
  if (!allow_http && !original_url.toLowerCase().startsWith("https://")) {
    return [null, ALLOW_UNSECURE_HTTP] as [null, string];
  }

  const is_clean_and_whitelisted = await database.snapps.validate(
    original_url,
    fetch,
  );
  if (!is_clean_and_whitelisted) {
    return [null, SNAPP_ORIGIN_URL_BLACKLISTED] as [null, string];
  }

  if (!shortcode) shortcode = generateId(5);

  const exists = await prisma.snapp.count({
    where: { shortcode: { startsWith: shortcode }, id: { not: id } },
  });
  const password_hash = secret !== null && secret !== "this-snapp-has-secret"
    ? await hash(secret, {
      // recommended minimum parameters
      memoryCost: 19456,
      timeCost: 2,
      outputLen: 32,
      parallelism: 1,
    })
    : secret === null
      ? null
      : undefined;

  const settings = getServerSideSettings();
  const isActiveTagsAsPrefix = settings.get<boolean>(TAGS_AS_PREFIX);
  if (isActiveTagsAsPrefix === true && tags?.length === 0) {
    return [null, TAGS_AS_PREFIX] as [null, string];
  }
  if (isActiveTagsAsPrefix) {
    await prisma.snapp.update({ where: { id }, data: { tags: { set: [] } } });
  }
  await prisma.snapp.update({
    where: { id },
    data: {
      tags: { set: [] }
    }
  });
  const edit_snapp = await prisma.snapp.update({
    where: { id },
    data: {
      original_url,
      userId: snappUserId,
      shortcode: exists ? `${shortcode}-${exists}` : shortcode,
      notes,
      secret: password_hash,
      expiration,
      max_usages: max_usages || -1,
      disabled,
      tags: {
        connectOrCreate: tags?.map((t) => (
          {
            where: {
              slug: t,
            },
            create: {
              name: t,
              slug: t,
            },
          }
        )),
      },
    },
  });

  return [edit_snapp, null] as [Snapp, null];
};
