import * as v from 'valibot';

export const UrlMetricsQuerySchema = v.object({
	extended: v.optional(v.string()),
	from: v.optional(v.string()),
	to: v.optional(v.string())
});
export const GlobalMetricsQuerySchema = v.object({
	from: v.optional(v.string()),
	to: v.optional(v.string()),
	urlId: v.optional(v.string()),
});

export const UrlMetricsDaySeriesPointSchema = v.object({
	day: v.date(),
	visits: v.number()
});

export const UrlMetricsBaseStatsSchema = v.object({
	from: v.date(),
	stats: v.object({
		external: v.array(UrlMetricsDaySeriesPointSchema),
		internal: v.array(UrlMetricsDaySeriesPointSchema)
	}),
	to: v.date()
});

export const UrlMetricsDayVisitSchema = v.object({
	day: v.date(),
	external: v.number(),
	internal: v.number()
});

export const UrlBrowserVisitSchema = v.object({
	browser: v.nullable(v.string()),
	day: v.date(),
	external: v.number(),
	internal: v.number()
});

export const UrlCityVisitSchema = v.object({
	city: v.nullable(v.string()),
	day: v.date(),
	external: v.number(),
	internal: v.number()
});

export const UrlCountryVisitSchema = v.object({
	country: v.nullable(v.string()),
	day: v.date(),
	external: v.number(),
	internal: v.number()
});

export const UrlDeviceVisitSchema = v.object({
	day: v.date(),
	device: v.nullable(v.string()),
	external: v.number(),
	internal: v.number()
});

export const UrlLanguageVisitSchema = v.object({
	day: v.date(),
	external: v.number(),
	internal: v.number(),
	language: v.nullable(v.string())
});

export const UrlOsVisitSchema = v.object({
	day: v.date(),
	external: v.number(),
	internal: v.number(),
	os: v.nullable(v.string())
});

export const UrlReferrerVisitSchema = v.object({
	day: v.date(),
	external: v.number(),
	internal: v.number(),
	referrer: v.nullable(v.string())
});

export const UrlRegionVisitSchema = v.object({
	day: v.date(),
	external: v.number(),
	internal: v.number(),
	region: v.nullable(v.string())
});

export const UrlUtmVisitSchema = v.object({
	day: v.date(),
	external: v.number(),
	internal: v.number(),
	utm: v.nullable(v.string())
});

export const UrlVisitorOrgVisitSchema = v.object({
	day: v.date(),
	external: v.number(),
	internal: v.number(),
	visitorOrganizationId: v.nullable(v.string())
});

export const UrlMetricsBreakdownSchema = v.object({
	browsers: v.array(UrlBrowserVisitSchema),
	cities: v.array(UrlCityVisitSchema),
	countries: v.array(UrlCountryVisitSchema),
	devices: v.array(UrlDeviceVisitSchema),
	languages: v.array(UrlLanguageVisitSchema),
	os: v.array(UrlOsVisitSchema),
	referrers: v.array(UrlReferrerVisitSchema),
	regions: v.array(UrlRegionVisitSchema),
	utms: v.optional(v.array(v.string())),
	visitorOrganizations: v.array(UrlVisitorOrgVisitSchema)
});

/**
 * Extended response shape when `extended=true`.
 * Assumes the helper returns the base stats plus the
 * full breakdown under `metrics`.
 */
export const UrlMetricsExtendedResponseSchema = v.object({
	from: v.date(),
	metrics: UrlMetricsBreakdownSchema,
	stats: v.object({
		external: v.array(UrlMetricsDaySeriesPointSchema),
		internal: v.array(UrlMetricsDaySeriesPointSchema)
	}),
	to: v.date()
});

/**
 * Union of the two possible responses:
 * - base stats (`extended` omitted or false)
 * - base stats + metrics (`extended=true`)
 */
export const UrlMetricsResponseSchema = v.union([
	UrlMetricsBaseStatsSchema,
	UrlMetricsExtendedResponseSchema
]);
