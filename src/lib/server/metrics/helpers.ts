import { getLocale } from "$lib/paraglide/runtime";
import { and, eq, gte, lte, sql } from "drizzle-orm";

import { db } from "../db";
import { apikey, metric, session, url, user, watchlist } from "../db/schema";

export type AnyVisit =
  | BrowserVisit
  | CityVisit
  | CountryVisit
  | DayVisit
  | DeviceVisit
  | LanguageVisit
  | OsVisit
  | ReferrerVisit
  | RegionVisit
  | UtmVisit
  | VisitorOrgVisit;

export type Args = {
  from?: Date;
  organizationId: string;
  to?: Date;
  urlId?: string;
  user: UserRole;
  utmFilter?: Record<string, string>;
  utmKeys?: string[];
};

export type BrowserVisit = { browser: null | string } & DayVisit;
export type CityVisit = { city: null | string } & DayVisit;
export type CountryVisit = { country: null | string } & DayVisit;
export type DayVisit = {
  day: Date;
  external: number;
  internal: number;
};
export type DeviceVisit = { device: null | string } & DayVisit;
export type LanguageVisit = { language: null | string } & DayVisit;
export type OsVisit = { os: null | string } & DayVisit;
export type ReferrerVisit = { referrer: null | string } & DayVisit;
export type RegionVisit = { region: null | string } & DayVisit;
export type UserRole = { id: string; role: string };

export type UtmVisit = { utm: null | string } & DayVisit;

export type VisitorOrgVisit = { visitorOrganizationId: null | string } & DayVisit;

const dayExpr = sql`DATE(${metric.timestamp})`
  .mapWith((d) => new Date(d))
  .as("day");

const mkInternalExternal = (orgId: string) => ({
  day: dayExpr,
  external: sql<number>`
    SUM(CASE WHEN ${metric.organizationId} <> ${orgId} THEN 1 ELSE 0 END)
  `.mapWith(Number).as("external"),
  internal: sql<number>`
    SUM(CASE WHEN ${metric.organizationId} = ${orgId} THEN 1 ELSE 0 END)
  `.mapWith(Number).as("internal"),
});

const buildBaseMetricWhere = ({
  from,
  organizationId,
  to,
  urlId,
  user,
}: Args) =>
  and(
    eq(url.organizationId, organizationId),
    user.role === "user" ? eq(metric.ownerId, user.id) : undefined,
    from ? gte(metric.timestamp, from) : undefined,
    to ? lte(metric.timestamp, to) : undefined,
    urlId ? eq(metric.urlId, urlId) : undefined,
  );

const buildUtmWhere = (utmFilter?: Record<string, string>) => {
  if (!utmFilter || Object.keys(utmFilter).length === 0) {
    return undefined;
  }
  return and(
    ...Object.entries(utmFilter).map(([key, value]) =>
      sql`${metric.utm} -> ${key} ->> 'value' = ${value}`,
    ),
  );
};

const buildUtmKeysWhere = (utmKeys?: string[]) => {
  if (!utmKeys || utmKeys.length === 0) {
    return undefined;
  }
  return and(...utmKeys.map((key) => sql`${metric.utm} ? ${key}`));
};

export const buildMetricWhere = (args: Args) =>
  and(
    buildBaseMetricWhere(args),
    buildUtmWhere(args.utmFilter),
    buildUtmKeysWhere(args.utmKeys),
  );

export const getOrgBrowserStats = async (
  args: Args,
): Promise<BrowserVisit[]> => {
  const where = buildMetricWhere(args);
  return db
    .select({
      browser: metric.browser,
      ...mkInternalExternal(args.organizationId),
    })
    .from(metric)
    .innerJoin(url, eq(metric.urlId, url.id))
    .where(where)
    .groupBy(metric.browser, dayExpr)
    .orderBy(dayExpr);
};

export const getOrgDeviceStats = async (
  args: Args,
): Promise<DeviceVisit[]> => {
  const where = buildMetricWhere(args);

  return db
    .select({
      device: metric.device,
      ...mkInternalExternal(args.organizationId),
    })
    .from(metric)
    .innerJoin(url, eq(metric.urlId, url.id))
    .where(where)
    .groupBy(metric.device, dayExpr)
    .orderBy(dayExpr);
};

export const getOrgOsStats = async (args: Args): Promise<OsVisit[]> => {
  const where = buildMetricWhere(args);

  return db
    .select({
      os: metric.os,
      ...mkInternalExternal(args.organizationId),
    })
    .from(metric)
    .innerJoin(url, eq(metric.urlId, url.id))
    .where(where)
    .groupBy(metric.os, dayExpr)
    .orderBy(dayExpr);
};

export const getOrgLanguageStats = async (
  args: Args,
): Promise<LanguageVisit[]> => {
  const where = buildMetricWhere(args);

  return db
    .select({
      language: metric.language,
      ...mkInternalExternal(args.organizationId),
    })
    .from(metric)
    .innerJoin(url, eq(metric.urlId, url.id))
    .where(where)
    .groupBy(metric.language, dayExpr)
    .orderBy(dayExpr);
};

export const getOrgReferrerStats = async (
  args: Args,
): Promise<ReferrerVisit[]> => {
  const where = buildMetricWhere(args);

  return db
    .select({
      referrer: metric.referrer,
      ...mkInternalExternal(args.organizationId),
    })
    .from(metric)
    .innerJoin(url, eq(metric.urlId, url.id))
    .where(where)
    .groupBy(metric.referrer, dayExpr)
    .orderBy(dayExpr);
};

export const getOrgCityStats = async (args: Args): Promise<CityVisit[]> => {
  const where = buildMetricWhere(args);

  return db
    .select({
      city: metric.city,
      ...mkInternalExternal(args.organizationId),
    })
    .from(metric)
    .innerJoin(url, eq(metric.urlId, url.id))
    .where(where)
    .groupBy(metric.city, dayExpr)
    .orderBy(dayExpr);
};

export const getOrgRegionStats = async (
  args: Args,
): Promise<RegionVisit[]> => {
  const where = buildMetricWhere(args);

  return db
    .select({
      region: metric.region,
      ...mkInternalExternal(args.organizationId),
    })
    .from(metric)
    .innerJoin(url, eq(metric.urlId, url.id))
    .where(where)
    .groupBy(metric.region, dayExpr)
    .orderBy(dayExpr);
};

export const getOrgCountryStats = async (
  args: Args,
): Promise<CountryVisit[]> => {
  const where = buildMetricWhere(args);

  return db
    .select({
      country: metric.country,
      ...mkInternalExternal(args.organizationId),
    })
    .from(metric)
    .innerJoin(url, eq(metric.urlId, url.id))
    .where(where)
    .groupBy(metric.country, dayExpr)
    .orderBy(dayExpr);
};

export const getOrgVisitorOrganizationStats = async (
  args: Args,
): Promise<VisitorOrgVisit[]> => {
  const where = buildMetricWhere(args);

  return db
    .select({
      visitorOrganizationId: metric.organizationId,
      ...mkInternalExternal(args.organizationId),
    })
    .from(metric)
    .innerJoin(url, eq(metric.urlId, url.id))
    .where(where)
    .groupBy(metric.organizationId, dayExpr)
    .orderBy(dayExpr);
};

type MetricUtm = Record<
  string,
  {
    key: string;
    name: string;
    value: string;
  }
>;

export const populateUtmFromMetrics = async (
  args: Args,
): Promise<Args["utmKeys"]> => {
  const where = buildMetricWhere(args);

  const rows = await db
    .select({
      utm: metric.utm,
    })
    .from(metric)
    .innerJoin(url, eq(metric.urlId, url.id))
    .where(where)
    .limit(256);

  if (rows.length === 0) {
    return args.utmKeys && args.utmKeys.length > 0 ? args.utmKeys : [];
  }

  const keySet = new Set<string>();

  for (const row of rows) {
    const utm = row.utm as MetricUtm | null | undefined;
    if (!utm) continue;

    for (const key of Object.keys(utm)) {
      keySet.add(key);
    }
  }

  const allKeys = Array.from(keySet);

  if (args.utmKeys && args.utmKeys.length > 0) {
    const filterSet = new Set(args.utmKeys);
    return allKeys.filter((k) => filterSet.has(k));
  }

  return allKeys;
};

export type UtmValueOptions = Record<string, string[]>;

export const getUtmValueOptions = async (
  args: Args,
): Promise<UtmValueOptions> => {
  const utmKeys = args.utmKeys ?? [];
  if (utmKeys.length === 0) return {};
  const where = buildMetricWhere(args);

  const rows = await db
    .select({ utm: metric.utm })
    .from(metric)
    .innerJoin(url, eq(metric.urlId, url.id))
    .where(where)
    .limit(1000);

  if (rows.length === 0) return {};

  const buckets: Record<string, Set<string>> = {};
  for (const key of utmKeys) {
    buckets[key] = new Set<string>();
  }

  for (const row of rows) {
    const utm = row.utm as MetricUtm | null | undefined;
    if (!utm) continue;

    for (const key of utmKeys) {
      const entry = utm[key];
      const value = entry?.value;
      if (typeof value === "string" && value.length > 0) {
        buckets[key].add(value);
      }
    }
  }

  const result: UtmValueOptions = {};

  for (const [key, set] of Object.entries(buckets)) {
    if (set.size === 0) continue;
    const values = Array.from(set);
    values.sort((a, b) => a.localeCompare(b));
    result[key] = values;
  }

  return result;
};

export const getOrganizationDashboardMetrics = async (args: Args) => {
  const [
    browsers,
    devices,
    os,
    languages,
    referrers,
    cities,
    countries,
    regions,
    visitorOrganizations,
    utms,
    utmsWithValue
  ] = await Promise.all([
    getOrgBrowserStats(args),
    getOrgDeviceStats(args),
    getOrgOsStats(args),
    getOrgLanguageStats(args),
    getOrgReferrerStats(args),
    getOrgCityStats(args),
    getOrgCountryStats(args),
    getOrgRegionStats(args),
    getOrgVisitorOrganizationStats(args),
    populateUtmFromMetrics(args),
    getUtmValueOptions(args),
  ]);

  return {
    browsers,
    cities,
    countries,
    devices,
    languages,
    os,
    referrers,
    regions,
    utms,
    utmsWithValue,
    visitorOrganizations,
  };
};

export type AdminLogDetail =
  | ApiKeyLogDetail
  | UrlLogDetail
  | UserBanLogDetail
  | WatchlistLogDetail;

export type AdminLogEntry = {
  actor: { id: string; image?: null | string; username: null | string } | null;
  detail: AdminLogDetail;
  id: string;
  target: LogTarget;
  timestamp: Date;
  type: AdminLogType;
};

export type AdminLogType =
  | "apikey.updated"
  | "domain.watchlist"
  | "url.updated"
  | "user.banned"
  | "username.watchlist";

export type ApiKeyLogDetail = {
  enabled: boolean;
};

export type LogTarget = {
  id: null | string;
  name: null | string;
};

export type UrlLogDetail = {
  active: boolean;
  shortcode: string;
  status: "blocked" | "clean";
};

export type UserApiKeyLogDetail = {
  enabled: boolean;
  name: null | string;
};

export type UserBanLogDetail = {
  banned: boolean;
  expires: Date | null;
  reason: null | string;
};

export type UserLogDetail =
  | UserApiKeyLogDetail
  | UserSessionLogDetail
  | UserUrlLogDetail;

export type UserLogEntry = {
  detail: UserLogDetail;
  id: string;
  target: LogTarget;
  timestamp: Date;
  type: UserLogType;
};

export type UserLogType = "apikey.updated" | "session.login" | "url.updated";

export type UserSessionLogDetail = {
  ua: null | string;
};

export type UserUrlLogDetail = {
  active: boolean;
  shortcode: string;
  status: "blocked" | "clean";
};

export type WatchlistLogDetail = {
  allowed: boolean;
  domain: null | string;
  username: null | string;
};

export async function getAdminActivityLog(
  orgId: string,
): Promise<AdminLogEntry[]> {
  const urlEvents = await db
    .select({
      active: url.active,
      actor: { id: user.id, image: user.image, username: user.username },
      id: url.id,
      shortcode: url.shortcode,
      status: url.status,
      timestamp: url.updatedAt,
    })
    .from(url)
    .leftJoin(user, eq(url.userId, user.id))
    .where(eq(url.organizationId, orgId));

  const mappedUrl: AdminLogEntry[] = urlEvents.map((e) => ({
    actor: e.actor?.id ? e.actor : null,
    detail: {
      active: e.active,
      id: e.id,
      shortcode: e.shortcode,
      status: e.status as "blocked" | "clean",
    },
    id: e.id,
    target: {
      id: e.id,
      name: e.shortcode,
    },
    timestamp: e.timestamp,
    type: "url.updated",
  }));

  const wl = await db
    .select({
      allowed: watchlist.allowed,
      domain: watchlist.domain,
      id: watchlist.id,
      timestamp: watchlist.createdAt,
      username: watchlist.username,
    })
    .from(watchlist);

  const mappedWL: AdminLogEntry[] = wl.map((w) => ({
    actor: null,
    detail: {
      allowed: w.allowed,
      domain: w.domain,
      username: w.username,
    },
    id: w.id,
    target: {
      id: w.id,
      name: w.username ?? w.domain ?? null,
    },
    timestamp: w.timestamp,
    type: w.domain ? "domain.watchlist" : "username.watchlist",
  }));

  const ak = await db
    .select({
      actor: { id: user.id, username: user.username },
      enabled: apikey.enabled,
      id: apikey.id,
      name: apikey.name,
      timestamp: apikey.updatedAt,
    })
    .from(apikey)
    .leftJoin(user, eq(apikey.userId, user.id));

  const mappedAK: AdminLogEntry[] = ak.map((a) => ({
    actor: a.actor?.id ? a.actor : null,
    detail: { enabled: a.enabled ?? false },
    id: a.id,
    target: {
      id: a.id,
      name: a.name,
    },
    timestamp: a.timestamp,
    type: "apikey.updated",
  }));

  const bans = await db
    .select({
      banned: user.banned,
      expires: user.banExpires,
      id: user.id,
      reason: user.banReason,
      timestamp: user.updatedAt,
      username: user.username,
    })
    .from(user)
    .where(eq(user.banned, true));

  const mappedBans: AdminLogEntry[] = bans.map((b) => ({
    actor: null,
    detail: {
      banned: b.banned ?? false,
      expires: b.expires ?? null,
      id: b.id,
      reason: b.reason ?? null,
    },
    id: b.id,
    target: {
      id: b.id,
      name: b.username,
    },
    timestamp: b.timestamp,
    type: "user.banned",
  }));

  return [...mappedUrl, ...mappedWL, ...mappedAK, ...mappedBans]
    .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
    .slice(0, 200);
}

export async function getUserActivityLog(
  orgId: string,
  userId: string,
): Promise<UserLogEntry[]> {
  const urls = await db
    .select({
      active: url.active,
      id: url.id,
      shortcode: url.shortcode,
      status: url.status,
      timestamp: url.updatedAt,
    })
    .from(url)
    .where(and(eq(url.organizationId, orgId), eq(url.userId, userId)));

  const mappedUrls: UserLogEntry[] = urls.map((u) => ({
    detail: {
      active: u.active,
      id: u.id,
      shortcode: u.shortcode,
      status: u.status as "blocked" | "clean",
    },
    id: u.id,
    target: {
      id: u.id,
      name: u.shortcode,
    },
    timestamp: u.timestamp,
    type: "url.updated",
  }));

  const keys = await db
    .select({
      enabled: apikey.enabled,
      id: apikey.id,
      name: apikey.name,
      timestamp: apikey.updatedAt,
    })
    .from(apikey)
    .where(eq(apikey.userId, userId));

  const mappedKeys: UserLogEntry[] = keys.map((a) => ({
    detail: {
      enabled: a.enabled ?? false,
      name: a.name,
    },
    id: a.id,
    target: {
      id: a.id,
      name: a.name,
    },
    timestamp: a.timestamp,
    type: "apikey.updated",
  }));

  const sessions = await db
    .select({
      id: session.id,
      timestamp: session.createdAt,
      ua: session.userAgent,
    })
    .from(session)
    .where(eq(session.userId, userId));

  const mappedSessions: UserLogEntry[] = sessions.map((s) => ({
    detail: {
      ua: s.ua,
    },
    id: s.id,
    target: {
      id: s.id,
      name: s.timestamp.toLocaleDateString(getLocale(), {
        dateStyle: "short",
      }),
    },
    timestamp: s.timestamp,
    type: "session.login" as const,
  }));

  return [...mappedUrls, ...mappedKeys, ...mappedSessions]
    .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
    .slice(0, 200);
}
