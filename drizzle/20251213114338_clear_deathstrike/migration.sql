CREATE TABLE "account" (
	"access_token" text,
	"access_token_expires_at" timestamp,
	"account_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"id" text PRIMARY KEY,
	"id_token" text,
	"password" text,
	"provider_id" text NOT NULL,
	"refresh_token" text,
	"refresh_token_expires_at" timestamp,
	"scope" text,
	"updated_at" timestamp NOT NULL,
	"user_id" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "apikey" (
	"created_at" timestamp NOT NULL,
	"enabled" boolean DEFAULT true,
	"expires_at" timestamp,
	"id" text PRIMARY KEY,
	"key" text NOT NULL,
	"last_refill_at" timestamp,
	"last_request" timestamp,
	"metadata" text,
	"name" text,
	"permissions" text,
	"prefix" text,
	"rate_limit_enabled" boolean DEFAULT true,
	"rate_limit_max" integer DEFAULT 10,
	"rate_limit_time_window" integer DEFAULT 86400000,
	"refill_amount" integer,
	"refill_interval" integer,
	"remaining" integer,
	"request_count" integer DEFAULT 0,
	"start" text,
	"updated_at" timestamp NOT NULL,
	"user_id" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "invitation" (
	"created_at" timestamp DEFAULT now() NOT NULL,
	"email" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"id" text PRIMARY KEY,
	"inviter_id" text NOT NULL,
	"organization_id" text NOT NULL,
	"role" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"team_id" text
);
--> statement-breakpoint
CREATE TABLE "member" (
	"created_at" timestamp NOT NULL,
	"id" text PRIMARY KEY,
	"organization_id" text NOT NULL,
	"role" text DEFAULT 'member' NOT NULL,
	"user_id" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "metric" (
	"browser" text,
	"city" text,
	"country" text,
	"cpu" text,
	"device" text,
	"id" text PRIMARY KEY,
	"language" text,
	"organization_id" text NOT NULL,
	"os" text,
	"owner_id" text NOT NULL,
	"referrer" text,
	"region" text,
	"timestamp" timestamp DEFAULT now() NOT NULL,
	"url_id" text,
	"user_agent" text,
	"utm" jsonb
);
--> statement-breakpoint
CREATE TABLE "organization" (
	"created_at" timestamp NOT NULL,
	"id" text PRIMARY KEY,
	"logo" text,
	"metadata" text,
	"name" text NOT NULL,
	"slug" text NOT NULL UNIQUE
);
--> statement-breakpoint
CREATE TABLE "organization_role" (
	"created_at" timestamp DEFAULT now() NOT NULL,
	"id" text PRIMARY KEY,
	"organization_id" text NOT NULL,
	"permission" text NOT NULL,
	"role" text NOT NULL,
	"updated_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "rate_limit" (
	"count" integer,
	"id" text PRIMARY KEY,
	"key" text,
	"last_request" bigint
);
--> statement-breakpoint
CREATE TABLE "session" (
	"active_organization_id" text,
	"active_team_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"expires_at" timestamp NOT NULL,
	"id" text PRIMARY KEY,
	"impersonated_by" text,
	"ip_address" text,
	"token" text NOT NULL UNIQUE,
	"updated_at" timestamp NOT NULL,
	"user_agent" text,
	"user_id" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tag" (
	"id" text PRIMARY KEY,
	"tag" text NOT NULL UNIQUE
);
--> statement-breakpoint
CREATE TABLE "team" (
	"created_at" timestamp NOT NULL,
	"id" text PRIMARY KEY,
	"name" text NOT NULL,
	"organization_id" text NOT NULL,
	"updated_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "team_member" (
	"created_at" timestamp,
	"id" text PRIMARY KEY,
	"team_id" text NOT NULL,
	"user_id" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "team_url" (
	"team_id" text,
	"url_id" text,
	CONSTRAINT "team_url_pkey" PRIMARY KEY("team_id","url_id")
);
--> statement-breakpoint
CREATE TABLE "two_factor" (
	"backup_codes" text NOT NULL,
	"id" text PRIMARY KEY,
	"secret" text NOT NULL,
	"user_id" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "url" (
	"active" boolean NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"expires_at" timestamp,
	"hit" integer DEFAULT 0 NOT NULL,
	"id" text PRIMARY KEY,
	"limit" integer DEFAULT -1 NOT NULL,
	"notes" text,
	"organization_id" text NOT NULL,
	"original_url" text NOT NULL,
	"secret" text,
	"shortcode" text NOT NULL,
	"status" text DEFAULT 'clean' NOT NULL,
	"updated_at" timestamp NOT NULL,
	"user_id" text NOT NULL,
	"utm" jsonb,
	CONSTRAINT "org_shortcode_unique" UNIQUE("organization_id","shortcode")
);
--> statement-breakpoint
CREATE TABLE "url_tag" (
	"tag_id" text,
	"url_id" text,
	CONSTRAINT "url_tag_pkey" PRIMARY KEY("url_id","tag_id")
);
--> statement-breakpoint
CREATE TABLE "user" (
	"ban_expires" timestamp,
	"banned" boolean DEFAULT false,
	"ban_reason" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"display_username" text,
	"email" text NOT NULL UNIQUE,
	"email_verified" boolean DEFAULT false NOT NULL,
	"id" text PRIMARY KEY,
	"image" text,
	"name" text NOT NULL,
	"notes" text DEFAULT '',
	"role" text DEFAULT 'user' NOT NULL,
	"two_factor_enabled" boolean DEFAULT false,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"username" text UNIQUE
);
--> statement-breakpoint
CREATE TABLE "verification" (
	"created_at" timestamp DEFAULT now() NOT NULL,
	"expires_at" timestamp NOT NULL,
	"id" text PRIMARY KEY,
	"identifier" text NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"value" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "vtapi_cache" (
	"created_at" timestamp DEFAULT now() NOT NULL,
	"domain" text NOT NULL UNIQUE,
	"result" text
);
--> statement-breakpoint
CREATE TABLE "watchlist" (
	"allowed" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"domain" text,
	"id" text PRIMARY KEY,
	"username" text
);
--> statement-breakpoint
CREATE INDEX "account_userId_idx" ON "account" ("user_id");--> statement-breakpoint
CREATE INDEX "apikey_key_idx" ON "apikey" ("key");--> statement-breakpoint
CREATE INDEX "apikey_userId_idx" ON "apikey" ("user_id");--> statement-breakpoint
CREATE INDEX "invitation_organizationId_idx" ON "invitation" ("organization_id");--> statement-breakpoint
CREATE INDEX "invitation_email_idx" ON "invitation" ("email");--> statement-breakpoint
CREATE INDEX "member_organizationId_idx" ON "member" ("organization_id");--> statement-breakpoint
CREATE INDEX "member_userId_idx" ON "member" ("user_id");--> statement-breakpoint
CREATE INDEX "metric_owner_idx" ON "metric" ("owner_id");--> statement-breakpoint
CREATE INDEX "metric_url_idx" ON "metric" ("url_id");--> statement-breakpoint
CREATE INDEX "metric_url_ts_idx" ON "metric" ("url_id","timestamp");--> statement-breakpoint
CREATE INDEX "metric_organization_idx" ON "metric" ("organization_id");--> statement-breakpoint
CREATE INDEX "metric_organization_idx_owner_idx" ON "metric" ("organization_id","owner_id");--> statement-breakpoint
CREATE INDEX "metric_timestamp_idx" ON "metric" ("timestamp");--> statement-breakpoint
CREATE INDEX "metric_org_url_ts_idx" ON "metric" ("organization_id","url_id","timestamp");--> statement-breakpoint
CREATE INDEX "metric_day_idx" ON "metric" (DATE("timestamp"));--> statement-breakpoint
CREATE INDEX "metric_org_ts_idx" ON "metric" ("organization_id","timestamp");--> statement-breakpoint
CREATE INDEX "metric_utm_gin_idx" ON "metric" USING gin ("utm");--> statement-breakpoint
CREATE INDEX "organizationRole_organizationId_idx" ON "organization_role" ("organization_id");--> statement-breakpoint
CREATE INDEX "organizationRole_role_idx" ON "organization_role" ("role");--> statement-breakpoint
CREATE INDEX "session_userId_idx" ON "session" ("user_id");--> statement-breakpoint
CREATE INDEX "team_organizationId_idx" ON "team" ("organization_id");--> statement-breakpoint
CREATE INDEX "teamMember_teamId_idx" ON "team_member" ("team_id");--> statement-breakpoint
CREATE INDEX "teamMember_userId_idx" ON "team_member" ("user_id");--> statement-breakpoint
CREATE INDEX "team_url_team_idx" ON "team_url" ("team_id");--> statement-breakpoint
CREATE INDEX "team_url_url_idx" ON "team_url" ("url_id");--> statement-breakpoint
CREATE INDEX "twoFactor_secret_idx" ON "two_factor" ("secret");--> statement-breakpoint
CREATE INDEX "twoFactor_userId_idx" ON "two_factor" ("user_id");--> statement-breakpoint
CREATE INDEX "urls_idx" ON "url" ("id");--> statement-breakpoint
CREATE INDEX "urls_to_user_idx" ON "url" ("user_id");--> statement-breakpoint
CREATE INDEX "url_tag_tag_idx" ON "url_tag" ("tag_id");--> statement-breakpoint
CREATE INDEX "url_tag_url_idx" ON "url_tag" ("url_id");--> statement-breakpoint
CREATE INDEX "verification_identifier_idx" ON "verification" ("identifier");--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "apikey" ADD CONSTRAINT "apikey_user_id_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "invitation" ADD CONSTRAINT "invitation_inviter_id_user_id_fkey" FOREIGN KEY ("inviter_id") REFERENCES "user"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "invitation" ADD CONSTRAINT "invitation_organization_id_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organization"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "member" ADD CONSTRAINT "member_organization_id_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organization"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "member" ADD CONSTRAINT "member_user_id_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "metric" ADD CONSTRAINT "metric_organization_id_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organization"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "metric" ADD CONSTRAINT "metric_owner_id_user_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "user"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "metric" ADD CONSTRAINT "metric_url_id_url_id_fkey" FOREIGN KEY ("url_id") REFERENCES "url"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "organization_role" ADD CONSTRAINT "organization_role_organization_id_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organization"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "team" ADD CONSTRAINT "team_organization_id_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organization"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "team_member" ADD CONSTRAINT "team_member_team_id_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "team"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "team_member" ADD CONSTRAINT "team_member_user_id_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "team_url" ADD CONSTRAINT "team_url_team_id_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "team"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "team_url" ADD CONSTRAINT "team_url_url_id_url_id_fkey" FOREIGN KEY ("url_id") REFERENCES "url"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "two_factor" ADD CONSTRAINT "two_factor_user_id_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "url" ADD CONSTRAINT "url_organization_id_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organization"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "url" ADD CONSTRAINT "url_user_id_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "url_tag" ADD CONSTRAINT "url_tag_tag_id_tag_id_fkey" FOREIGN KEY ("tag_id") REFERENCES "tag"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "url_tag" ADD CONSTRAINT "url_tag_url_id_url_id_fkey" FOREIGN KEY ("url_id") REFERENCES "url"("id") ON DELETE CASCADE;