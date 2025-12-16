import { generateId } from 'better-auth';
import { defineRelations, sql } from 'drizzle-orm';
import {
	boolean,
	index,
	integer,
	jsonb,
	pgTable,
	primaryKey,
	text,
	timestamp,
	unique
} from 'drizzle-orm/pg-core';

import {
	account,
	apikey,
	invitation,
	member,
	organization,
	organizationRole,
	session,
	team,
	teamMember,
	twoFactor,
	user
} from './auth-schema';

export const vtApiCache = pgTable('vtapi_cache', {
	createdAt: timestamp('created_at',{mode:"date"}).defaultNow().notNull(),
	domain: text('domain').notNull().unique(),
	result: text('result')
});

export const watchlist = pgTable('watchlist', {
	allowed: boolean('allowed').default(false).notNull(),
	createdAt: timestamp('created_at',{mode:"date"}).defaultNow().notNull(),
	domain: text('domain'),
	id: text('id').primaryKey(),
	username: text('username')
});

export const url = pgTable(
	'url',
	{
		active: boolean('active')
			.notNull()
			.$defaultFn(() => true),
		createdAt: timestamp('created_at',{mode:"date"}).defaultNow().notNull().$type<Date>(),
		expiresAt: timestamp('expires_at',{mode:"date"}),
		hit: integer('hit').default(0).notNull(),
		id: text('id').primaryKey(),
		limit: integer('limit').default(-1).notNull(),
		notes: text('notes'),
		organizationId: text('organization_id').references(()=>organization.id, {onDelete:'cascade'}).notNull(),
		originalUrl: text('original_url').notNull(),
		secret: text('secret'),
		shortcode: text('shortcode')
		.$defaultFn(() => generateId(5))
		.notNull(),
		status: text('status').notNull().default('clean'),
		updatedAt: timestamp('updated_at',{mode:"date"})
			.$onUpdate(() => new Date())
			.notNull(),
		userId: text('user_id')
			.references(() => user.id, { onDelete: 'cascade' })
			.notNull(),
		utm: jsonb('utm')
			.$defaultFn(() => ({}))
			.$type<Record<string, Record<'key' | 'name' | 'value', string>>>()
	},
	(table) => [
		index('urls_idx').on(table.id),
		index('urls_to_user_idx').on(table.userId),
		unique('org_shortcode_unique').on(table.organizationId, table.shortcode)
	]
);

export const tag = pgTable('tag', {
	id: text('id').primaryKey(),
	tag: text('tag').unique().notNull()
});

export const metric = pgTable(
	'metric',
	{
		browser: text('browser'),
		city: text('city'),
		country: text('country'),
		cpu: text('cpu'),
		device: text('device'),
		id: text('id').primaryKey(),
		language: text('language'),
		organizationId: text('organization_id').references(() => organization.id, { onDelete: 'cascade' }).notNull(),
		os: text('os'),
		ownerId: text('owner_id').references(() => user.id, { onDelete: 'cascade' }).notNull(),
		referrer: text('referrer'),
		region: text('region'),
		timestamp: timestamp('timestamp',{mode:"date"}).defaultNow().notNull(),
		urlId: text('url_id').references(() => url.id, { onDelete: 'cascade' }),
		userAgent: text('user_agent'),
			utm: jsonb('utm')
			.$defaultFn(() => ({}))
			.$type<Record<string, Record<'key' | 'name' | 'value', string>>>()
	},
	(t) => [
		index('metric_owner_idx').on(t.ownerId),
		index('metric_url_idx').on(t.urlId),
		index("metric_url_ts_idx").on(t.urlId, t.timestamp),
		index('metric_organization_idx').on(t.organizationId),
		index('metric_organization_idx_owner_idx').on(t.organizationId, t.ownerId),
		index('metric_timestamp_idx').on(t.timestamp),
		index("metric_org_url_ts_idx").on(t.organizationId, t.urlId, t.timestamp),
		index("metric_day_idx").on(sql`DATE(${t.timestamp})`),
		    index('metric_org_ts_idx').on(t.organizationId, t.timestamp),
			    index('metric_utm_gin_idx').using(
					'gin', t.utm)
	]
);

export const urlToTag = pgTable(
	'url_tag',
	{
		tagId: text('tag_id')
			.notNull()
			.references(() => tag.id, { onDelete: 'cascade' }),
		urlId: text('url_id')
			.notNull()
			.references(() => url.id, { onDelete: 'cascade' })
	},
	(t) => [
		primaryKey({ columns: [t.urlId, t.tagId] }),
		index('url_tag_tag_idx').on(t.tagId),
		index('url_tag_url_idx').on(t.urlId)
	]
);

export const teamToUrl = pgTable(
	'team_url',
	{
		teamId: text('team_id')
			.notNull()
			.references(() => team.id, { onDelete: 'cascade' }),
		urlId: text('url_id')
			.notNull()
			.references(() => url.id, { onDelete: 'cascade' })
	},
	(t) => [
		primaryKey({ columns: [t.teamId, t.urlId] }),
		index('team_url_team_idx').on(t.teamId),
		index('team_url_url_idx').on(t.urlId)
	]
);

export const relations = defineRelations(
	{
		account,
		apikey,
		invitation,
		member,
		metric,
		organization,
		organizationRole,
		session,
		tag,
		team,
		teamMember,
		teamToUrl,
		twoFactor,
		url,
		urlToTag,
		user,
		vtApiCache,
		watchlist
	},
	(r) => ({
		account: {
			user: r.one.user({
				from: r.account.userId,
				to: r.user.id
			})
		},
		apikey: {
			user: r.one.user({
				from: r.apikey.userId,
				to: r.user.id
			})
		},
		invitation: {
			organization: r.one.organization({
				from: r.invitation.organizationId,
				to: r.organization.id
			}),
			user: r.one.user({
				from: r.invitation.inviterId,
				to: r.user.id
			})
		},
		member: {
			organization: r.one.organization({
				from: r.member.organizationId,
				to: r.organization.id
			}),
			user: r.one.user({
				from: r.member.userId,
				to: r.user.id
			})
		},
		organization: {
			invitations: r.many.invitation(),
			members: r.many.member(),
			organizationRoles: r.many.organizationRole(),
			teams: r.many.team(),
			urls: r.many.url({
				from: r.organization.id,
				to: r.url.id,
			})
		},
		organizationRole: {
			organization: r.one.organization({
				from: r.organizationRole.organizationId,
				to: r.organization.id
			})
		},
		session: {
			user: r.one.user({
				from: r.session.userId,
				to: r.user.id
			})
		},
		tag: {
			urls: r.many.url({
				from: r.tag.id.through(r.urlToTag.tagId),
				to: r.url.id.through(r.urlToTag.urlId)
			})
		},
		team: {
			organization: r.one.organization({
				from: r.team.organizationId,
				to: r.organization.id
			}),
			teamMembers: r.many.teamMember(),
			urls: r.many.url({
				from: r.team.id.through(r.teamToUrl.teamId),
				to: r.url.id.through(r.teamToUrl.urlId)
			})
		},
		teamMember: {
			team: r.one.team({
				from: r.teamMember.teamId,
				to: r.team.id
			}),
			user: r.one.user({
				from: r.teamMember.userId,
				to: r.user.id
			})
		},
		teamToUrl: {
			team: r.one.team({
				from: r.teamToUrl.teamId,
				to: r.team.id
			}),
			url: r.one.url({
				from: r.teamToUrl.urlId,
				to: r.url.id
			})
		},
		twoFactor: {
			user: r.one.user({
				from: r.twoFactor.userId,
				to: r.user.id
			})
		},
		url: {
			organization: r.one.organization({
				from: r.url.organizationId,
				to: r.organization.id
			}),
			tags: r.many.tag({
				from: r.url.id.through(r.urlToTag.urlId),
				to: r.tag.id.through(r.urlToTag.tagId)
			}),
			teams: r.many.team({
				from: r.url.id.through(r.teamToUrl.urlId),
				to: r.team.id.through(r.teamToUrl.teamId)
			}),
			user: r.one.user({
				from: r.url.userId,
				to: r.user.id
			}),
			
		},
		urlToTag: {
			tag: r.one.tag({
				from: r.urlToTag.tagId,
				to: r.tag.id
			}),
			url: r.one.url({
				from: r.urlToTag.urlId,
				to: r.url.id
			})
		},
		user: {
			accounts: r.many.account(),
			apikeys: r.many.apikey(),
			invitations: r.many.invitation(),
			members: r.many.member(),
			sessions: r.many.session(),
			teamMembers: r.many.teamMember(),
			twoFactors: r.many.twoFactor(),
			urls: r.many.url()
		}
	})
);

export * from './auth-schema';
